// src/components/legal/legal-shell.tsx
import Link from "next/link";
import { Schibsted_Grotesk } from "next/font/google";
import { LEGAL } from "@/lib/legal";

const font = Schibsted_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

const THEME = {
  "--paper": "#F2F4F3",
  "--ink": "#0E2430",
  "--muted": "#4A5B63",
  "--line": "#D3DAD9",
  "--accent": "#3347E0",
} as React.CSSProperties;

export function LegalShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={THEME}
      className={`${font.className} min-h-screen bg-[var(--paper)] text-[var(--ink)] antialiased`}
    >
      <header className="mx-auto flex max-w-2xl items-center justify-between px-5 py-5">
        <Link href="/" className="text-lg font-extrabold tracking-tight">{LEGAL.productName}</Link>
        <nav aria-label="Legal" className="flex gap-4 text-sm text-[var(--muted)]">
          <Link href="/terms" className="hover:text-[var(--ink)]">Terms</Link>
          <Link href="/privacy" className="hover:text-[var(--ink)]">Privacy</Link>
        </nav>
      </header>

      <main
        className="mx-auto max-w-2xl px-5 pb-20 pt-6
          [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-tight
          [&_p]:mt-3 [&_p]:leading-relaxed
          [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-6 [&_li]:leading-relaxed
          [&_a]:underline [&_a]:underline-offset-4 [&_strong]:font-semibold"
      >
        <h1 className="text-4xl font-extrabold tracking-tight">{title}</h1>
        <div className="mt-2 text-sm text-[var(--muted)]">Effective {LEGAL.effectiveDate}</div>
        {children}
      </main>
    </div>
  );
}
