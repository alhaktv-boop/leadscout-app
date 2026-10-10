// src/app/dashboard/billing/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PLANS, type PlanKey } from "@/lib/plans";
import { getSubscription, isActiveStatus } from "@/lib/subscription";
import { ManageButton, SubscribeButton } from "@/components/billing-buttons";

const PLAN_KEYS = Object.keys(PLANS) as PlanKey[];

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sub = await getSubscription(supabase, user.id);
  const active = isActiveStatus(sub?.status);
  const pastDue = sub?.status === "past_due" || sub?.status === "unpaid";
  const current = sub ? PLANS[sub.plan as PlanKey] : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A plan turns on scanning. Without one, you can set up a project but not run scans.
        </p>
      </div>

      {sp.checkout === "success" && (
        <p className="rounded-md border border-emerald-600/40 bg-emerald-50 p-3 text-sm text-emerald-900">
          Payment received. Your plan activates within a few seconds. Refresh this page if it still shows no plan.
        </p>
      )}

      {pastDue && (
        <p role="alert" className="rounded-md border border-red-600/40 bg-red-50 p-3 text-sm text-red-900">
          Your last payment failed, so scans are paused. Update your card under Manage billing.
        </p>
      )}

      {active && current ? (
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-5">
          <div>
            <h2 className="font-medium">
              {current.name} plan{sub?.status === "trialing" ? " (trial)" : ""}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {current.maxProjects === 1 ? "1 project" : `Up to ${current.maxProjects} projects`}
              {sub?.current_period_end &&
                ` · Renews or ends ${new Date(sub.current_period_end).toLocaleDateString("en-GB")}`}
            </p>
          </div>
          <ManageButton />
        </section>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2">
          {PLAN_KEYS.map((key) => {
            const plan = PLANS[key];
            return (
              <div key={key} className="flex flex-col gap-3 rounded-lg border p-5">
                <div>
                  <h2 className="text-lg font-medium">{plan.name}</h2>
                  <p className="text-sm text-muted-foreground">{plan.blurb}</p>
                </div>
                <p className="text-2xl font-semibold">{plan.priceLabel}</p>
                <ul className="flex-1 space-y-1 text-sm">
                  {plan.features.map((f) => <li key={f}>{f}</li>)}
                </ul>
                <SubscribeButton plan={key} label={`Choose ${plan.name}`} />
              </div>
            );
          })}
        </section>
      )}

      {(pastDue || sub?.stripe_customer_id) && !active && (
        <div><ManageButton /></div>
      )}
    </div>
  );
}
