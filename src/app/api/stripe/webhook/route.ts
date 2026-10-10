// src/app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { planFromPriceId } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs"; // التحقق من التوقيع يحتاج الجسم الخام (raw body)

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(raw, signature ?? "", process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        if (s.mode === "subscription" && typeof s.subscription === "string") {
          await syncSubscription(s.subscription, s.client_reference_id);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await syncSubscription((event.data.object as Stripe.Subscription).id);
        break;
      }
    }
  } catch (e) {
    console.error("[stripe webhook]", event.type, e);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 }); // يجعل Stripe يعيد المحاولة
  }

  return NextResponse.json({ received: true });
}

// نجلب أحدث حالة من Stripe دائمًا بدل الاعتماد على حمولة الحدث،
// فلا يضر وصول الأحداث بترتيب مختلف. والـ upsert يجعل المعالجة آمنة عند التكرار.
async function syncSubscription(subscriptionId: string, userIdHint?: string | null) {
  let sub: Stripe.Subscription;
  try {
    sub = await getStripe().subscriptions.retrieve(subscriptionId);
  } catch (e) {
    // اشتراك حُذف مع حساب محذوف: لا شيء لمزامنته
    if ((e as { code?: string }).code === "resource_missing") return;
    throw e;
  }
  const admin = createAdminClient();
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  let userId: string | null = sub.metadata?.user_id || userIdHint || null;
  if (!userId) {
    const { data } = await admin
      .from("subscriptions").select("user_id").eq("stripe_customer_id", customerId).maybeSingle();
    userId = data?.user_id ?? null;
  }
  if (!userId) {
    console.error("[stripe webhook] no user found for subscription", sub.id);
    return;
  }

  const item = sub.items.data[0];
  // في إصدارات Stripe API الأحدث انتقل current_period_end من الاشتراك إلى عنصر الاشتراك
  const periodEnd: number | undefined =
    (item as unknown as { current_period_end?: number })?.current_period_end ??
    (sub as unknown as { current_period_end?: number }).current_period_end;

  const plan = planFromPriceId(item?.price.id);
  if (!plan) console.warn("[stripe webhook] unknown price id", item?.price.id);

  const { error } = await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      plan: sub.status === "canceled" ? "free" : plan ?? "starter",
      status: sub.status,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (error) {
    // 23503 = المستخدم لم يعد موجودًا (حُذف حسابه). نتجاهل الحدث كي لا يعيد Stripe المحاولة إلى الأبد.
    if (error.code === "23503") {
      console.warn("[stripe webhook] user no longer exists, skipping", sub.id);
      return;
    }
    throw error;
  }
}
