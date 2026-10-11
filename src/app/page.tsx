import type { Metadata } from "next";
import Link from "next/link";
import { Schibsted_Grotesk } from "next/font/google";

const font = Schibsted_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "LeadScout: Find High-Intent B2B Clients Automatically",
  description:
    "LeadScout scans Reddit and global online communities to instantly find and organize decision-makers asking for your services.",
  openGraph: {
    title: "LeadScout: Find High-Intent B2B Clients Automatically",
    description:
      "Find the online threads where potential clients are already asking for your B2B services, complete with AI-drafted responses.",
    type: "website",
  },
};

const STEPS = [
  {
    title: "Define Your Ideal Client & Keywords",
    body: "Enter your product or service description, target keywords, and the online communities where your B2B buyers ask for recommendations.",
  },
  {
    title: "AI Scans & Scores Buyer Intent",
    body: "LeadScout scans discussions in real-time, scoring leads from 0 to 100 based on buyer intent, budget cues, and problem alignment.",
  },
  {
    title: "Review, Draft & Close Deals",
    body: "Every qualified lead arrives with an AI-crafted, non-spammy initial response. Edit with one click and engage instantly.",
  },
];

const FAQ = [
  {
    q: "How does LeadScout find B2B leads?",
    a: "LeadScout continuously monitors subreddits and tech communities for buyer intent keywords. It filters out noise and highlights direct requests for your services.",
  },
  {
    q: "Is it tailored for SaaS, Agencies, and Consultants?",
    a: "Yes! LeadScout is purpose-built for B2B founders, agencies, freelancers, and consultants looking for high-ticket clients without cold calling.",
  },
  {
    q: "Does LeadScout automatically post replies on my behalf?",
    a: "No. LeadScout generates high-converting draft responses for your review, allowing you to maintain complete control over your brand voice.",
  },
];

export default function LandingPage() {
  return (
    <div className={`${font.className} min-h-screen bg-[#faf8f5] text-slate-900 font-sans selection:bg-teal-100 selection:text-teal-900`}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center text-white font-extrabold text-2xl shadow-md shadow-teal-600/20">
            L
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900">LeadScout</span>
        </div>
        <nav className="flex items-center gap-6">
          <Link href="/login" className="text-slate-600 hover:text-slate-900 font-semibold transition-colors">
            Sign In
          </Link>
          <Link
            href="/login"
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md shadow-teal-600/20 hover:shadow-lg hover:shadow-teal-600/30 transition-all"
          >
            Get Started Free
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto text-center pt-16 pb-24 px-4">
        <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-800 border border-teal-200/80 px-4 py-2 rounded-full text-sm font-bold mb-8 shadow-sm">
          <span className="text-teal-600 font-extrabold">✦</span> Built for B2B Founders, Agencies & Freelancers
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.1] mb-8">
          Spend Less Time Chasing <br />
          <span className="text-teal-600">More Time Closing</span>
        </h1>

        <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto mb-12 leading-relaxed font-normal">
          LeadScout instantly finds and organizes contact-ready B2B leads asking for your solutions, so you can focus on outreach and closing deals instead of manual research.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <Link
            href="/login"
            className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-lg px-9 py-4 rounded-xl transition-all shadow-xl shadow-teal-600/25 hover:shadow-2xl hover:shadow-teal-600/30 hover:-translate-y-0.5 flex items-center justify-center gap-3"
          >
            Start Finding Leads <span className="text-xl">→</span>
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-lg px-8 py-4 rounded-xl transition-all shadow-sm hover:shadow"
          >
            Request a Demo
          </Link>
        </div>

        {/* Steps Section */}
        <div className="grid md:grid-cols-3 gap-8 text-left mt-24 border-t border-slate-200/80 pt-16">
          {STEPS.map((step, idx) => (
            <div key={idx} className="bg-white p-8 rounded-2xl border border-slate-200/70 shadow-sm hover:shadow-md transition-all">
              <div className="w-10 h-10 bg-teal-50 text-teal-700 font-extrabold rounded-xl flex items-center justify-center mb-6 text-lg border border-teal-100">
                0{idx + 1}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
              <p className="text-slate-600 leading-relaxed text-sm md:text-base">{step.body}</p>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-28 text-left max-w-3xl mx-auto border-t border-slate-200/80 pt-16">
          <h2 className="text-3xl font-black text-slate-900 mb-10 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {FAQ.map((item, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
                <h4 className="text-lg font-bold text-slate-900 mb-2">{item.q}</h4>
                <p className="text-slate-600 text-sm md:text-base leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-10 text-center text-slate-500 text-sm">
        <p>© {new Date().getFullYear()} LeadScout. Global B2B Lead Generation Platform.</p>
      </footer>
    </div>
  );
}
