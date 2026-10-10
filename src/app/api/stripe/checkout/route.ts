// src/app/api/stripe/checkout/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { appUrl, getStripe } from "@/lib/stripe";
import { PLANS } from "@/lib/plans";

const Body = z.object({ plan: z.enum(["starter", "pro"]) });

// حالات يكون فيها للمستخدم اشتراك قائم في Stripe: التغيير يتم من بوابة الفوترة لا من Checkout جديد
const HAS_SUBSCRIPTION = ["active", "trialing", "past_due", "unpaid"];

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in first" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Unknown plan" }, { status: 400 });

  const plan = PLANS[parsed.data.plan];
  if (!plan.priceId) {
    return NextResponse.json({ error: "This plan is not configured yet" }, { status: 500 });
  }

  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("subscriptions").select("*").eq("user_id", user.id).maybeSingle();

  if (sub?.stripe_subscription_id && HAS_SUBSCRIPTION.includes(sub.status)) {
    return NextResponse.json(
      { error: "You already have a subscription. Use Manage billing to change or cancel it." },
      { status: 409 }
    );
  }

  const stripe = getStripe();
  let customerId: string | null = sub?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;
    await admin
      .from("subscriptions")
      .upsert({ user_id: user.id, stripe_customer_id: customerId }, { onConflict: "user_id" });
  }

  const base = appUrl(req);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{ price: plan.priceId, quantity: 1 }],
    allow_promotion_codes: true,
    subscription_data: { metadata: { user_id: user.id } }, // تصل مع أحداث الاشتراك لاحقًا
    success_url: `${base}/dashboard/billing?checkout=success`,
    cancel_url: `${base}/dashboard/billing`,
  });

  return NextResponse.json({ url: session.url });
}
