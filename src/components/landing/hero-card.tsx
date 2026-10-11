// src/components/landing/hero-card.tsx
// مثال توضيحي لفرصة حقيقية في المنتج. كل الأسماء والنصوص مختلقة وموسومة بذلك.
"use client";
import { useState } from "react";

const REPLY =
  "What tends to work is taking the awkwardness out of it: automatic reminders 3 days before the due date, on the due date, and 7 days after, so the nudge comes from the system instead of from you. Most invoicing tools can schedule this. I work on one called Ledgerly if you want to compare options, but the reminder schedule matters more than the tool.";

export function HeroCard() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(REPLY);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* النص ظاهر ويمكن نسخه يدويًا */
    }
  }

  return (
    <figure className="m-0 mx-auto w-full max-w-2xl text-left">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-3.5">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden />
            r/freelance · post · 38 min ago
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-extrabold text-emerald-700 ring-1 ring-emerald-200">
            92% match
          </span>
        </div>

        <div className="flex flex-col gap-4 p-5 sm:p-6">
          <div>
            <p className="text-lg font-bold leading-snug text-slate-900">
              Anyone found a way to chase late invoices without feeling awkward?
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
              Third client this quarter paying 30 days late. I hate sending the follow-up email. Is there a
              tool that handles this, or do I just have to get thicker skin?
            </p>
          </div>

          <p className="text-sm text-slate-700">
            <span className="font-bold text-teal-700">Asking for a recommendation.</span> Describes the exact
            problem your product solves and asks for a tool.
          </p>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Suggested reply</p>
            <p className="rounded-2xl border border-teal-100 bg-teal-50/60 p-4 text-sm leading-relaxed text-slate-800">
              {REPLY}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={copy}
              className="inline-flex h-10 items-center rounded-xl bg-slate-900 px-5 text-sm font-bold text-white transition-colors hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
            >
              Copy reply
            </button>
            <span role="status" aria-live="polite" className="text-sm font-semibold text-emerald-700">
              {copied ? "Copied" : ""}
            </span>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-xs text-slate-500">
        An example lead. The post, the username and the product are invented.
      </figcaption>
    </figure>
  );
}
