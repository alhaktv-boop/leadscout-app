// src/app/api/stripe/portal/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { appUrl, getStripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in first" }, { status: 401 });

  const { data: sub } = await supabase
    .from("subscriptions").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
  if (!sub?.stripe_customer_id) {
    return NextResponse.json({ error: "No billing account yet. Subscribe to a plan first." }, { status: 400 });
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${appUrl(req)}/dashboard/billing`,
  });
  return NextResponse.json({ url: session.url });
}
