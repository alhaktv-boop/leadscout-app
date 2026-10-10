// src/lib/stripe.ts
import Stripe from "stripe";

let client: Stripe | null = null;

// تهيئة كسولة: لا يفشل البناء على Vercel إن لم تكن المفاتيح متاحة أثناء الـ build
export function getStripe() {
  if (!client) {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not set");
    client = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return client;
}

export function appUrl(req: Request) {
  return process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
}
