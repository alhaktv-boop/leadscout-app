// src/lib/subscription.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { FREE_MAX_PROJECTS, PLANS, type PlanKey } from "./plans";

export type SubscriptionRow = {
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: string;
  status: string;
  current_period_end: string | null;
};

export const isActiveStatus = (s?: string | null) => s === "active" || s === "trialing";

export async function getSubscription(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("subscriptions").select("*").eq("user_id", userId).maybeSingle();
  return (data as SubscriptionRow | null) ?? null;
}

export function maxProjectsFor(sub: SubscriptionRow | null) {
  if (!sub || !isActiveStatus(sub.status)) return FREE_MAX_PROJECTS;
  return PLANS[sub.plan as PlanKey]?.maxProjects ?? FREE_MAX_PROJECTS;
}
