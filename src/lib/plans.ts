// src/lib/plans.ts
// ⚠️ الأسعار هنا نصوص عرض فقط (placeholders). السعر الفعلي يُحدَّد في Stripe عبر الـ Price ID.
// عدّل priceLabel ليطابق ما أنشأته في Stripe.

export const PLANS = {
  starter: {
    name: "Starter",
    priceId: process.env.STRIPE_PRICE_STARTER ?? "",
    priceLabel: "$29 / month",
    maxProjects: 1,
    blurb: "One product, scanned automatically.",
    features: ["1 project", "Automatic scans", "AI relevance score and reply drafts"],
  },
  pro: {
    name: "Pro",
    priceId: process.env.STRIPE_PRICE_PRO ?? "",
    priceLabel: "$79 / month",
    maxProjects: 5,
    blurb: "Several products or clients.",
    features: ["Up to 5 projects", "Automatic scans", "AI relevance score and reply drafts"],
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export const FREE_MAX_PROJECTS = 1;

export function planFromPriceId(priceId?: string | null): PlanKey | null {
  if (!priceId) return null;
  return (Object.keys(PLANS) as PlanKey[]).find((k) => PLANS[k].priceId === priceId) ?? null;
}
