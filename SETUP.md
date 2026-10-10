# LeadScout MVP — الخطوة 1: إعداد المشروع

## الأوامر

```bash
npx create-next-app@latest leadscout --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd leadscout

npx shadcn@latest init
npx shadcn@latest add button card input textarea badge tabs dialog sonner

npm i @supabase/supabase-js @supabase/ssr openai zod stripe
```

## `.env.local`

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # سيرفر فقط

OPENAI_API_KEY=

REDDIT_CLIENT_ID=                 # من https://www.reddit.com/prefs/apps (نوع: web app أو script)
REDDIT_CLIENT_SECRET=
REDDIT_USER_AGENT="web:leadscout:0.1 (by /u/YOUR_USERNAME)"

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STARTER=

CRON_SECRET=                      # نص عشوائي طويل
```

## هيكلية الملفات

```
leadscout/
├─ vercel.json                         # جدولة الـ Cron
├─ supabase/schema.sql                 # المخطط (جاهز)
└─ src/
   ├─ middleware.ts                    # حماية /dashboard بجلسة Supabase
   ├─ app/
   │  ├─ (marketing)/page.tsx          # صفحة الهبوط + الأسعار
   │  ├─ (auth)/login/page.tsx
   │  ├─ dashboard/
   │  │  ├─ layout.tsx
   │  │  ├─ page.tsx                   # Inbox: قائمة الفرص + زر نسخ الرد
   │  │  ├─ projects/new/page.tsx      # keywords + subreddits + وصف المنتج
   │  │  ├─ projects/[id]/page.tsx     # تعديل الإعدادات
   │  │  └─ billing/page.tsx
   │  └─ api/
   │     ├─ cron/scan/route.ts         # ✅ جاهز: فحص دوري
   │     ├─ projects/route.ts          # CRUD
   │     ├─ projects/[id]/scan/route.ts# فحص يدوي ("Scan now")
   │     ├─ leads/[id]/route.ts        # تغيير الحالة (copied/replied/dismissed)
   │     ├─ stripe/checkout/route.ts
   │     └─ stripe/webhook/route.ts    # مزامنة جدول subscriptions
   ├─ components/
   │  ├─ ui/                           # shadcn
   │  ├─ lead-card.tsx                 # score badge + المسودة + Copy
   │  └─ project-form.tsx
   └─ lib/
      ├─ reddit.ts                     # ✅ جاهز
      ├─ ai.ts                         # ✅ جاهز
      ├─ scan.ts                       # ✅ جاهز
      ├─ stripe.ts
      └─ supabase/{client,server}.ts
```

## `vercel.json`

```json
{ "crons": [{ "path": "/api/cron/scan", "schedule": "0 7 * * *" }] }
```
(Vercel يرسل `Authorization: Bearer $CRON_SECRET` تلقائيًا إذا عرّفت المتغير `CRON_SECRET`.)
