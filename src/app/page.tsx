// src/app/page.tsx — Landing page
import type { Metadata } from "next";
import Link from "next/link";
import { Schibsted_Grotesk } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import { PLANS, type PlanKey } from "@/lib/plans";
import { HeroCard } from "@/components/landing/hero-card";

const font = Schibsted_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "LeadScout: find Reddit leads and draft the replies",
  description:
    "LeadScout watches the subreddits you pick, finds people asking for what you sell, scores each lead, and drafts a reply you can edit and post.",
  openGraph: {
    title: "LeadScout: find Reddit leads and draft the replies",
    description:
      "Find the Reddit threads where people are already asking for what you sell, with a drafted reply for each.",
    type: "website",
  },
};

// الألوان معرّفة هنا فقط، فلا تتأثر بثيم shadcn داخل لوحة التحكم
const THEME = {
  "--paper": "#F2F4F3",
  "--ink": "#0E2430",
  "--muted": "#4A5B63",
  "--line": "#D3DAD9",
  "--accent": "#3347E0",
} as React.CSSProperties;

const ctaCls =
  "inline-flex h-11 items-center rounded-md bg-[var(--accent)] px-5 font-medium text-white hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";
const linkCls =
  "underline decoration-[var(--line)] underline-offset-4 hover:decoration-[var(--ink)]";

const STEPS = [
  {
    title: "Describe what you sell",
    body: "Add your product, the words people use when they have the problem, and up to 10 subreddits to watch.",
  },
  {
    title: "LeadScout scans and scores",
    body: "It reads new posts and recent comments that match, and scores each one from 0 to 100 on whether the author would benefit. Anything under your minimum is dropped.",
  },
  {
    title: "Review, edit, copy",
    body: "Every lead comes with a drafted reply. Edit it, copy it in one click, and post it yourself from your own account.",
  },
];

const REPLY_RULES = [
  "It answers the person's actual question first, with something useful they can act on.",
  "It mentions your product at most once, and only when it genuinely fits.",
  "If you give a brand name, the reply says you're affiliated with it.",
  "It matches the language of the original post.",
  "Nothing is ever posted for you. You read it, change it, and send it.",
];

const FAQ = [
  {
    q: "Does LeadScout post on Reddit for me?",
    a: "No. It finds the thread and drafts a reply. You edit it and post it yourself, so every reply goes out under your name and your judgment.",
  },
  {
    q: "How does it decide something is a lead?",
    a: "It reads the post or comment next to your product description and scores from 0 to 100 how likely the author is to benefit from what you sell. Only results above your minimum score reach your inbox. The default minimum is 60, and you can change it per project.",
  },
  {
    q: "What does it scan, and how often?",
    a: "New posts that match your keywords and recent comments in the subreddits you chose. It runs automatically every day, and you can start a scan yourself at any time, up to once every 10 minutes.",
  },
  {
    q: "Will my replies get removed or my account banned?",
    a: "We can't promise that. Every subreddit sets its own rules on self-promotion. LeadScout writes replies that help first and disclose your affiliation, but read each community's rules before you post.",
  },
  {
    q: "What do I get without a plan?",
    a: "You can create an account and set up a project. A plan turns scanning on.",
  },
  {
    q: "Can I cancel?",
    a: "Yes. You can cancel or change your plan from the billing page whenever you like.",
  },
];

export default async function LandingPage() {
  // الصفحة العامة يجب أن تعمل حتى لو لم تُضبط متغيرات Supabase بعد
  let user: { id: string } | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }
  const ctaHref = user ? "/dashboard" : "/login";

  return (
    <div
      style={THEME}
      className={`${font.className} min-h-screen bg-[var(--paper)] text-[var(--ink)] antialiased`}
    >
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-5">
        <Link href="/" className="text-lg font-extrabold tracking-tight">LeadScout</Link>
        <nav aria-label="Main" className="flex items-center gap-5 text-sm">
          <a href="#how" className="hidden text-[var(--muted)] hover:text-[var(--ink)] sm:inline">How it works</a>
          <a href="#pricing" className="hidden text-[var(--muted)] hover:text-[var(--ink)] sm:inline">Pricing</a>
          <a href="#faq" className="hidden text-[var(--muted)] hover:text-[var(--ink)] sm:inline">FAQ</a>
          <Link href={ctaHref} className="font-medium underline underline-offset-4">
            {user ? "Open dashboard" : "Sign in"}
          </Link>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-5xl items-center gap-12 px-5 pb-20 pt-10 lg:grid-cols-[1fr_1.05fr] lg:pt-16">
          <div>
            <h1 className="max-w-xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.4rem]">
              Find the Reddit threads where people are already asking for what you sell
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-[var(--muted)]">
              LeadScout watches the subreddits you pick, scores every match, and drafts a helpful reply
              for each lead. You edit it, copy it, and post it.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link href={ctaHref} className={ctaCls}>
                {user ? "Open dashboard" : "Create your account"}
              </Link>
              <a href="#pricing" className={`text-sm ${linkCls}`}>See pricing</a>
            </div>
            <p className="mt-4 text-sm text-[var(--muted)]">
              Set up a project for free. Choose a plan when you're ready to scan.
            </p>
          </div>
          <HeroCard />
        </section>

        {/* How it works */}
        <section id="how" className="border-t border-[var(--line)]">
          <div className="mx-auto max-w-5xl px-5 py-20">
            <h2 className="max-w-lg text-3xl font-bold tracking-tight">From keywords to a reply you can send</h2>
            <ol className="mt-10 grid gap-10 sm:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s.title}>
                  <p className="text-3xl font-extrabold text-[var(--accent)]" aria-hidden>{i + 1}</p>
                  <h3 className="mt-2 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 leading-relaxed text-[var(--muted)]">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Replies */}
        <section className="border-t border-[var(--line)]">
          <div className="mx-auto grid max-w-5xl gap-10 px-5 py-20 md:grid-cols-[1fr_1.2fr]">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Replies that read like a person wrote them</h2>
              <p className="mt-4 max-w-md leading-relaxed text-[var(--muted)]">
                Reddit removes spam quickly. The drafts are written to help the thread first, so a mention
                of your product feels earned.
              </p>
            </div>
            <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {REPLY_RULES.map((r) => (
                <li key={r} className="py-4 leading-relaxed">{r}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="border-t border-[var(--line)]">
          <div className="mx-auto max-w-5xl px-5 py-20">
            <h2 className="text-3xl font-bold tracking-tight">Pricing</h2>
            <p className="mt-3 max-w-lg text-[var(--muted)]">
              Monthly plans. Set up a project for free, and a plan turns scanning on.
            </p>

            <div className="mt-10 grid divide-y divide-[var(--line)] rounded-lg border border-[var(--line)] bg-white sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              {(Object.keys(PLANS) as PlanKey[]).map((key) => {
                const plan = PLANS[key];
                return (
                  <div key={key} className="flex flex-col gap-4 p-6">
                    <div>
                      <h3 className="text-xl font-bold">{plan.name}</h3>
                      <p className="text-sm text-[var(--muted)]">{plan.blurb}</p>
                    </div>
                    <p className="text-3xl font-extrabold tracking-tight">{plan.priceLabel}</p>
                    <ul className="flex-1 space-y-2 text-sm">
                      {plan.features.map((f) => <li key={f}>{f}</li>)}
                    </ul>
                    <Link href={ctaHref} className={`${ctaCls} justify-center`}>
                      Choose {plan.name}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-t border-[var(--line)]">
          <div className="mx-auto max-w-3xl px-5 py-20">
            <h2 className="text-3xl font-bold tracking-tight">Questions</h2>
            <div className="mt-8 divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {FAQ.map((item) => (
                <details key={item.q} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]">
                    {item.q}
                    <span aria-hidden className="text-xl leading-none text-[var(--muted)]">
                      <span className="group-open:hidden">+</span>
                      <span className="hidden group-open:inline">−</span>
                    </span>
                  </summary>
                  <p className="mt-3 max-w-2xl leading-relaxed text-[var(--muted)]">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-[var(--line)]">
          <div className="mx-auto max-w-5xl px-5 py-20">
            <h2 className="max-w-xl text-3xl font-bold tracking-tight">Start with one subreddit and a few keywords</h2>
            <p className="mt-3 max-w-lg text-[var(--muted)]">
              You'll see what a good lead looks like for your product within the first scan.
            </p>
            <Link href={ctaHref} className={`${ctaCls} mt-6`}>
              {user ? "Open dashboard" : "Create your account"}
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--line)]">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-sm text-[var(--muted)]">
          <p>LeadScout drafts replies; you review and post them. Not affiliated with Reddit.</p>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/terms" className={linkCls}>Terms</Link>
            <Link href="/privacy" className={linkCls}>Privacy</Link>
            <Link href={ctaHref} className={linkCls}>{user ? "Dashboard" : "Sign in"}</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
