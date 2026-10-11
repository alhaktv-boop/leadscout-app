// src/components/landing/plan-button.tsx
// زر الاشتراك في صفحة الأسعار: يفتح Stripe Checkout للمستخدم المسجّل
"use client";
import { useState } from "react";
import { toast } from "sonner";

export function PlanButton({
  plan,
  label,
  highlighted,
}: {
  plan: "starter" | "pro";
  label: string;
  highlighted?: boolean;
}) {
  const [busy, setBusy] = useState(false);

  async function subscribe() {
    setBusy(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 401) {
        window.location.href = "/login?next=/dashboard/billing";
        return;
      }
      if (res.status === 409) {
        window.location.href = "/dashboard/billing";
        return;
      }
      if (!res.ok || !json.url) throw new Error(json.error ?? "Something went wrong");
      window.location.href = json.url;
    } catch (e) {
      toast.error((e as Error).message);
      setBusy(false);
    }
  }

  const base =
    "inline-flex h-12 w-full items-center justify-center rounded-xl text-base font-bold transition-all disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600";
  const look = highlighted
    ? "bg-teal-600 text-white shadow-lg shadow-teal-600/30 hover:bg-teal-700 hover:-translate-y-0.5"
    : "border border-slate-300 bg-white text-slate-900 hover:border-slate-400 hover:bg-slate-50";

  return (
    <button type="button" onClick={subscribe} disabled={busy} className={`${base} ${look}`}>
      {busy ? "Redirecting to checkout…" : label}
    </button>
  );
}
