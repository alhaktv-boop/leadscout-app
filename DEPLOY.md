# نشر LeadScout على Vercel

## 1) جهّز Stripe (وضع Test أولاً)

1. Dashboard ← Product catalog ← أنشئ منتجين (Starter و Pro) بسعر شهري متكرر. انسخ كل `price_...`.
   عدّل `priceLabel` في `src/lib/plans.ts` ليطابق الأسعار (الأرقام الحالية placeholders).
2. Settings ← Billing ← **Customer portal**: فعّله، واسمح بتحديث وسيلة الدفع وإلغاء الاشتراك (وتغيير الخطة إن أردت).
   بدونه سيفشل زر Manage billing.
3. للتجربة المحلية:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   الأمر يطبع `whsec_...` ضعه في `.env.local` كـ `STRIPE_WEBHOOK_SECRET`.
   ثم اشترك ببطاقة الاختبار `4242 4242 4242 4242`.

## 1b) حدّث قاعدة البيانات (مرة واحدة، قبل نشر هذه النسخة)

Supabase ← SQL Editor ← الصق محتوى `supabase/migrations/002_relevance_and_cost.sql` ونفّذه.
يضيف: كلمات الاستبعاد، وجدول `scanned_items` (يمنع إعادة تقييم نفس المنشور)، وأعمدة تتبع التوكنات في `scan_runs`.
بدونه سيفشل الفحص وحفظ المشاريع.

## 2) ارفع الكود

```bash
git init && git add . && git commit -m "LeadScout MVP"
# ادفعه إلى GitHub ثم: Vercel ← Add New ← Project ← اختر المستودع
```
تأكد أن `.env.local` غير مرفوع (create-next-app يضيفه إلى `.gitignore` تلقائيًا).

## 3) متغيرات البيئة على Vercel

Project Settings ← Environment Variables: أضف كل المتغيرات من `.env.example`.
- `NEXT_PUBLIC_APP_URL` = رابط الإنتاج النهائي (مثل `https://leadscout.app`).
- `CRON_SECRET` = نص عشوائي. Vercel يرسله تلقائيًا في Header الـ Cron.
- بعد أي تعديل على المتغيرات أعد النشر (Redeploy).

## 4) Webhook الإنتاج في Stripe

Developers ← Webhooks ← Add endpoint:
- URL: `https://نطاقك/api/stripe/webhook`
- الأحداث: `checkout.session.completed`، `customer.subscription.created`، `customer.subscription.updated`، `customer.subscription.deleted`
- انسخ الـ Signing secret إلى `STRIPE_WEBHOOK_SECRET` على Vercel ثم أعد النشر.

## 5) Supabase

Authentication ← URL Configuration: ضع Site URL = رابط الإنتاج، وأضفه إلى Redirect URLs.
(وفعّل "Confirm email" في الإنتاج.)

## 6) الـ Cron

`vercel.json` يشغّل الفحص **مرة يوميًا** (`0 7 * * *` بتوقيت UTC)، وهذا مقبول على كل الخطط.
للفحص كل ساعتين غيّره إلى `0 */2 * * *`، لكن ذلك يتطلب خطة Pro.
اختبر يدويًا:
```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://نطاقك/api/cron/scan
```

## 7) قائمة فحص قبل أول عميل

- [ ] اشتراك تجريبي كامل: Checkout ← webhook ← يظهر الاشتراك في جدول `subscriptions` ← يعمل Scan now
- [ ] إلغاء الاشتراك من البوابة ← الحالة تصبح canceled ويتوقف الفحص
- [ ] مستخدم بلا اشتراك لا يستطيع Scan now (رسالة 402) ولا إنشاء أكثر من مشروع
- [ ] بدّل مفاتيح Stripe من `sk_test` إلى `sk_live` مع Webhook وPrice IDs الحية
- [ ] Reddit: راجع شروط استخدام API التجاري وسجّل التطبيق بالاسم الصحيح في `REDDIT_USER_AGENT`
- [ ] املأ كل القيم بين الأقواس `[ ]` في `src/lib/legal.ts` (الاسم القانوني، البريد، العنوان، القانون الحاكم، تاريخ السريان)
- [ ] اعرض صفحتي `/terms` و`/privacy` على الإنتاج وتأكد أنه لا يظهر فيهما أي نص بين أقواس
- [ ] في Stripe ← Settings ← Public details: ضع رابطي الشروط والخصوصية، فيظهران في صفحة الدفع والإيصالات
- [ ] راجع الصفحتين مع محامٍ مختص قبل التفعيل الحي (خصوصًا سياسة الاسترداد وقوانين المستهلك في بلدك)
- [ ] جرّب من صفحة Account: تنزيل البيانات، ثم حذف حساب تجريبي له اشتراك (يجب أن يختفي العميل من Stripe وتُحذف بياناته في Supabase)
- [ ] تأكد أن الـ Webhook لا يعيد المحاولة بعد حذف الحساب (Stripe ← Webhooks ← Recent deliveries)

## ملاحظات

- خطة Vercel Hobby للاستخدام غير التجاري فقط حسب شروطهم، وأي منتج مدفوع يحتاج Pro.
- الـ Cron الحالي يفحص المشاريع بالتتابع في طلب واحد. مع عشرات العملاء سيتجاوز المهلة،
  وعندها ننقل كل مشروع إلى مهمة مستقلة (طابور).
