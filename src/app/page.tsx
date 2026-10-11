// src/app/page.tsx — Landing page
import type { Metadata } from "next";
import Link from "next/link";
import { Schibsted_Grotesk } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import { PLANS, type PlanKey } from "@/lib/plans";
import { HeroCard } from "@/components/landing/hero-card";
import { PlanButton } from "@/components/landing/plan-button";
import { Toaster } from "@/components/ui/sonner";

const font = Schibsted_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "LeadScout: Find High-Intent B2B Clients Automatically",
  description:
    "LeadScout scans Reddit communities to find people asking for what you sell, scores every lead, and drafts a reply you can edit and post.",
  openGraph: {
    title: "LeadScout: Find High-Intent B2B Clients Automatically",
    description:
      "Find the online threads where potential clients are already asking for your services, with an AI-drafted reply for each.",
    type: "website",
  },
};

const STEPS = [
  {
    title: "Define your ideal client",
    body: "Describe what you sell, add the keywords your buyers use, and pick the communities where they ask for recommendations.",
  },
  {
    title: "AI scans and scores intent",
    body: "LeadScout reads new posts and comments every day and scores each from 0 to 100 on buyer intent and problem fit. Weak matches are dropped.",
  },
  {
    title: "Review, edit, reply",
    body: "Every qualified lead arrives with a non-spammy drafted reply. Edit it, copy it in one click, and post it from your own account.",
  },
];

const BENEFITS = [
  { t: "Answers first", d: "Each draft helps with the person's actual question before it ever mentions you." },
  { t: "Honest by default", d: "If you give a brand name, the reply discloses your affiliation with it." },
  { t: "Your voice, your call", d: "Nothing is ever posted for you. You read it, change it, and send it." },
  { t: "Matches the language", d: "Replies are written in the language of the original post." },
];

const FAQ = [
  {
    q: "How does LeadScout find leads?",
    a: "It monitors the communities you choose for new posts and comments that match your keywords, scores each one against your product description, and keeps only the results above your minimum score.",
  },
  {
    q: "Who is it built for?",
    a: "B2B founders, agencies, freelancers and consultants who want to find clients where they are already asking for help, without cold calling.",
  },
  {
    q: "Does LeadScout post replies on my behalf?",
    a: "No. It drafts the reply and you post it yourself, so every message goes out under your name and your judgment.",
  },
  {
    q: "Will my replies get removed or my account banned?",
    a: "We can't promise that. Each community sets its own rules on self-promotion. LeadScout writes replies that help first and disclose your affiliation, but read each community's rules before you post.",
  },
  {
    q: "What do I get without a plan?",
    a: "You can create an account and set up a project for free. A plan turns scanning on.",
  },
  {
    q: "Can I cancel?",
    a: "Yes. You can cancel or change your plan from the billing page at any time.",
  },
];

function Check() {
  return (
    <svg viewBox="0 0 20 20" className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 111.4-1.4l3.8 3.8 6.8-6.8a1 1 0 011.4 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function splitPrice(label: string) {
  const [amount, period] = label.split("/").map((s) => s.trim());
  return { amount, period: period ?? "month" };
}

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
  const planHref = "/login?next=/dashboard/billing";

  return (
    <div
      className={`${font.className} min-h-screen bg-[#faf8f5] text-slate-900 antialiased selection:bg-teal-100 selection:text-teal-900`}
    >
      <Toaster />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-[#faf8f5]/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-2xl font-extrabold text-white shadow-md shadow-teal-600/25">
              L
            </span>
            <span className="text-xl font-black tracking-tight">LeadScout</span>
          </Link>
          <nav aria-label="Main" className="flex items-center gap-3 sm:gap-6">
            <a href="#how" className="hidden text-sm font-semibold text-slate-600 hover:text-slate-900 md:inline">
              How it works
            </a>
            <a href="#pricing" className="hidden text-sm font-semibold text-slate-600 hover:text-slate-900 md:inline">
              Pricing
            </a>
            <a href="#faq" className="hidden text-sm font-semibold text-slate-600 hover:text-slate-900 md:inline">
              FAQ
            </a>
            {!user && (
              <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
                Sign In
              </Link>
            )}
            <Link
              href={ctaHref}
              className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-teal-600/25 transition-all hover:bg-teal-700 hover:shadow-lg sm:px-5"
            >
              {user ? "Open dashboard" : "Get Started Free"}
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-[420px] max-w-4xl rounded-full bg-teal-300/25 blur-3xl"
          />
          <div className="relative mx-auto max-w-5xl px-5 pb-16 pt-14 text-center sm:pt-20">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-teal-200/80 bg-teal-50 px-4 py-2 text-sm font-bold text-teal-800 shadow-sm">
              <span className="font-extrabold text-teal-600">✦</span> Built for B2B Founders, Agencies & Freelancers
            </div>
            <h1 className="text-5xl font-black leading-[1.08] tracking-tight sm:text-6xl md:text-7xl">
              Spend Less Time Chasing
              <br />
              <span className="bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
                More Time Closing
              </span>
            </h1>
            <p className="mx-auto mt-8 max-w-3xl text-lg leading-relaxed text-slate-600 sm:text-xl">
              LeadScout watches the communities you choose, finds people asking for what you sell, scores every
              lead from 0 to 100, and drafts a helpful reply, so you spend your time closing instead of
              searching.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href={ctaHref}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-teal-600 px-9 py-4 text-lg font-extrabold text-white shadow-xl shadow-teal-600/25 transition-all hover:-translate-y-0.5 hover:bg-teal-700 hover:shadow-2xl hover:shadow-teal-600/30 sm:w-auto"
              >
                {user ? "Open dashboard" : "Start Finding Leads"} <span className="text-xl">→</span>
              </Link>
              <a
                href="#pricing"
                className="w-full rounded-xl border border-slate-200 bg-white px-8 py-4 text-lg font-bold text-slate-800 shadow-sm transition-all hover:bg-slate-50 hover:shadow sm:w-auto"
              >
                See pricing
              </a>
            </div>
            <p className="mt-5 text-sm text-slate-500">
              Set up a project for free. Choose a plan when you're ready to scan.
            </p>
          </div>
        </section>

        {/* Product preview */}
        <section className="mx-auto max-w-6xl px-5 pb-24">
          <HeroCard />
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-16 border-t border-slate-200/80 bg-white/60">
          <div className="mx-auto max-w-6xl px-5 py-24">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-teal-700">How it works</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                From keywords to a reply you can send
              </h2>
            </div>
            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <div
                  key={s.title}
                  className="rounded-2xl border border-slate-200/70 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl border border-teal-100 bg-teal-50 text-lg font-extrabold text-teal-700">
                    0{i + 1}
                  </div>
                  <h3 className="mb-3 text-xl font-bold">{s.title}</h3>
                  <p className="leading-relaxed text-slate-600">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Replies */}
        <section className="border-t border-slate-200/80">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-24 md:grid-cols-[1fr_1.2fr]">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-teal-700">Replies</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                Replies that read like a person wrote them
              </h2>
              <p className="mt-4 leading-relaxed text-slate-600">
                Communities remove spam quickly. Every draft is written to help the thread first, so a mention
                of your product feels earned.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {BENEFITS.map((b) => (
                <div key={b.t} className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Check />
                    <h3 className="font-bold">{b.t}</h3>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{b.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="scroll-mt-16 border-t border-slate-200/80 bg-white/60">
          <div className="mx-auto max-w-5xl px-5 py-24">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-teal-700">Pricing</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Simple monthly plans</h2>
              <p className="mt-4 text-slate-600">
                Set up a project for free. A plan turns on daily scanning. Cancel any time.
              </p>
            </div>

            <div className="mx-auto mt-14 grid max-w-3xl gap-8 md:max-w-none md:grid-cols-2">
              {(Object.keys(PLANS) as PlanKey[]).map((key) => {
                const plan = PLANS[key];
                const { amount, period } = splitPrice(plan.priceLabel);
                const popular = key === "pro";
                return (
                  <div
                    key={key}
                    className={`relative flex flex-col rounded-3xl p-8 ${
                      popular
                        ? "border-2 border-teal-600 bg-white shadow-2xl shadow-teal-600/15"
                        : "border border-slate-200 bg-white shadow-sm"
                    }`}
                  >
                    {popular && (
                      <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-teal-600 px-4 py-1 text-xs font-extrabold uppercase tracking-wider text-white shadow-md">
                        Most popular
                      </span>
                    )}
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">{plan.blurb}</p>
                    <p className="mt-6 flex items-baseline gap-1">
                      <span className="text-5xl font-black tracking-tight">{amount}</span>
                      <span className="font-semibold text-slate-500">/ {period}</span>
                    </p>
                    <ul className="my-8 flex-1 space-y-3">
                      {plan.features.map((f) => (
                        <li key={f} className="flex gap-3 text-slate-700">
                          <Check />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    {user ? (
                      <PlanButton plan={key} label={`Get ${plan.name}`} highlighted={popular} />
                    ) : (
                      <Link
                        href={planHref}
                        className={`inline-flex h-12 w-full items-center justify-center rounded-xl text-base font-bold transition-all ${
                          popular
                            ? "bg-teal-600 text-white shadow-lg shadow-teal-600/30 hover:-translate-y-0.5 hover:bg-teal-700"
                            : "border border-slate-300 bg-white text-slate-900 hover:border-slate-400 hover:bg-slate-50"
                        }`}
                      >
                        Get {plan.name}
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="mt-8 text-center text-sm text-slate-500">
              Secure checkout by Stripe. Manage or cancel from your billing page at any time.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-16 border-t border-slate-200/80">
          <div className="mx-auto max-w-3xl px-5 py-24">
            <h2 className="text-center text-3xl font-black tracking-tight sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <div className="mt-12 space-y-4">
              {FAQ.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm open:shadow-md"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600">
                    {item.q}
                    <span aria-hidden className="text-2xl leading-none text-teal-600">
                      <span className="group-open:hidden">+</span>
                      <span className="hidden group-open:inline">−</span>
                    </span>
                  </summary>
                  <p className="mt-3 leading-relaxed text-slate-600">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-5 pb-24">
          <div className="mx-auto max-w-5xl rounded-3xl bg-slate-900 px-6 py-16 text-center shadow-2xl">
            <h2 className="mx-auto max-w-xl text-3xl font-black tracking-tight text-white sm:text-4xl">
              Start with one community and a few keywords
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-slate-300">
              You'll see what a good lead looks like for your product within the first scan.
            </p>
            <Link
              href={ctaHref}
              className="mt-8 inline-flex items-center gap-3 rounded-xl bg-teal-500 px-9 py-4 text-lg font-extrabold text-white shadow-xl shadow-teal-500/25 transition-all hover:-translate-y-0.5 hover:bg-teal-400"
            >
              {user ? "Open dashboard" : "Create your account"} <span className="text-xl">→</span>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200/80 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} LeadScout. Drafts replies; you review and post them. Not affiliated with Reddit.</p>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 font-semibold">
            <Link href="/terms" className="hover:text-slate-900">Terms</Link>
            <Link href="/privacy" className="hover:text-slate-900">Privacy</Link>
            <Link href={ctaHref} className="hover:text-slate-900">{user ? "Dashboard" : "Sign in"}</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
