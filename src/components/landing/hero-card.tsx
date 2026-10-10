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
      /* لا شيء: النص ظاهر ويمكن نسخه يدويًا */
    }
  }

  return (
    <figure className="m-0">
      <div className="flex overflow-hidden rounded-lg border border-[var(--line)] bg-white">
        <div className="w-1.5 shrink-0 bg-[#1E8E5A]" aria-hidden />
        <div className="flex min-w-0 flex-1 flex-col gap-3 p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm text-[var(--muted)]">
            <p>r/freelance, post, 38 minutes ago</p>
            <p className="font-semibold text-[var(--ink)]">92% match</p>
          </div>

          <div>
            <p className="font-semibold leading-snug">
              Anyone found a way to chase late invoices without feeling awkward?
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Third client this quarter paying 30 days late. I hate sending the follow-up email.
              Is there a tool that handles this, or do I just have to get thicker skin?
            </p>
          </div>

          <p className="text-sm">
            <span className="font-semibold">Asking for a recommendation.</span>{" "}
            Describes the exact problem your product solves and asks for a tool.
          </p>

          <div>
            <p className="mb-1.5 text-sm font-semibold">Suggested reply</p>
            <p className="rounded-md border border-[var(--line)] bg-[var(--paper)] p-3 text-sm leading-relaxed">
              {REPLY}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={copy}
              className="inline-flex h-9 items-center rounded-md bg-[var(--ink)] px-4 text-sm font-medium text-white hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              Copy reply
            </button>
            <span role="status" aria-live="polite" className="text-sm text-[#1E6B47]">
              {copied ? "Copied" : ""}
            </span>
          </div>
        </div>
      </div>
      <figcaption className="mt-2 text-xs text-[var(--muted)]">
        An example lead. The post, the username and the product are invented.
      </figcaption>
    </figure>
  );
}
