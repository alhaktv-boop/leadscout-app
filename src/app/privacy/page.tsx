// src/app/privacy/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell } from "@/components/legal/legal-shell";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: `Privacy Policy | ${LEGAL.productName}`,
  description: `How ${LEGAL.productName} collects, uses and protects personal data.`,
};

const PROVIDERS = [
  { name: "Supabase", use: "database and sign-in", url: "https://supabase.com/privacy" },
  { name: "Vercel", use: "hosting", url: "https://vercel.com/legal/privacy-policy" },
  { name: "OpenAI", use: "scoring and drafting replies", url: "https://openai.com/policies/privacy-policy" },
  { name: "Stripe", use: "payments", url: "https://stripe.com/privacy" },
  { name: "Reddit", use: "source of public posts and comments", url: "https://www.reddit.com/policies/privacy-policy" },
];

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy">
      <p>
        This policy explains what personal data {LEGAL.productName} collects, why, and what you can do
        about it. The controller of your data is {LEGAL.company}, {LEGAL.address}. Contact:{" "}
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
      </p>

      <h2>1. What we collect</h2>
      <ul>
        <li>
          <strong>Account data:</strong> your email address and a password. Passwords are stored hashed by
          our sign-in provider, and we never see them.
        </li>
        <li>
          <strong>Project data:</strong> the name, product description, brand name, keywords, subreddits
          and minimum score you enter.
        </li>
        <li>
          <strong>Lead data:</strong> public Reddit posts and comments found by your scans, with title,
          text, subreddit, the public Reddit username of the author, a link and the date. We also store the
          relevance score, intent label and explanation, the drafted reply with your edits, and the status
          you set.
        </li>
        <li>
          <strong>Billing data:</strong> payments are handled by Stripe. We store your Stripe customer ID,
          subscription ID, plan, status and renewal date. We do not receive or store card numbers.
        </li>
        <li>
          <strong>Technical data:</strong> scan history (time, counts, errors) and server logs, such as IP
          address and browser type, kept by our hosting provider for security and troubleshooting.
        </li>
      </ul>

      <h2>2. Cookies</h2>
      <p>
        We use only essential cookies that keep you signed in. We do not use advertising or analytics
        cookies.
      </p>

      <h2>3. How we use data and why</h2>
      <ul>
        <li>To provide the service you asked for, including scans, scoring and drafts (performance of a contract).</li>
        <li>To bill you and prevent fraud (contract, legal obligation and legitimate interests).</li>
        <li>To keep the service secure, fix problems and prevent abuse (legitimate interests).</li>
        <li>To send service messages such as receipts and important notices (contract and legitimate interests).</li>
        <li>To meet legal duties.</li>
      </ul>
      <p>We do not sell personal data and we do not show advertising.</p>

      <h2>4. Reddit users</h2>
      <p>
        Scans collect public content and public usernames of people who posted on Reddit. We use this only
        to show relevant threads to the customer who ran the scan. We do not contact these people, and we
        do not combine this data to build profiles. If you posted on Reddit and want your content removed
        from {LEGAL.productName}, email us with a link to the post and we will delete it.
      </p>

      <h2>5. AI processing</h2>
      <p>
        To score and draft, we send the text of a Reddit post or comment, together with your product
        description and brand name, to the OpenAI API. We do not send your email address or billing
        details. The score only decides whether a thread appears in your inbox. It has no legal or
        similarly significant effect on anyone.
      </p>

      <h2>6. Who we share data with</h2>
      <p>We use these service providers to run {LEGAL.productName}:</p>
      <ul>
        {PROVIDERS.map((p) => (
          <li key={p.name}>
            {p.name}, for {p.use}.{" "}
            <a href={p.url} target="_blank" rel="noopener noreferrer">Privacy policy</a>
          </li>
        ))}
      </ul>
      <p>
        We may also disclose data when the law requires it, to protect rights and safety, or as part of a
        merger or sale of the business, in which case we will tell you.
      </p>

      <h2>7. International transfers</h2>
      <p>
        Our providers may process data in countries outside your own, including the United States. Where
        the law requires it, we rely on safeguards such as standard contractual clauses.
      </p>

      <h2>8. How long we keep data</h2>
      <p>
        We keep account and project data while your account is active. When you delete a project, its
        leads and scan history are deleted with it. When you delete your account from the Account page, or ask us to, we delete your
        account data, except records we must keep by law, such as billing records.
      </p>

      <h2>9. Security</h2>
      <p>
        Data is sent over HTTPS, and access controls ensure that each account can read only its own
        projects and leads. No system is completely secure, so we cannot guarantee absolute security.
      </p>

      <h2>10. Your rights</h2>
      <p>
        Depending on where you live, for example in the EU, the UK or California, you may have the right to
        access, correct, delete or export your data, to restrict or object to certain processing, and to
        withdraw consent. Email <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> and we will reply within
        one month where the law sets that deadline. You can also complain to your local data protection
        authority. We do not sell or share personal information for advertising. You can download your data and delete your account yourself from the Account page in your dashboard.
      </p>

      <h2>11. Children</h2>
      <p>
        {LEGAL.productName} is for people aged 18 and over. We do not knowingly collect data from
        children.
      </p>

      <h2>12. Changes to this policy</h2>
      <p>
        We may update this policy. The effective date at the top shows the latest version, and for material
        changes we will notify you by email or in the app. See also our <Link href="/terms">Terms of Service</Link>.
      </p>
    </LegalShell>
  );
}
