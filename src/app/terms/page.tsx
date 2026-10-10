// src/app/terms/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell } from "@/components/legal/legal-shell";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: `Terms of Service | ${LEGAL.productName}`,
  description: `The terms that apply when you use ${LEGAL.productName}.`,
};

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service">
      <h2>1. About these terms</h2>
      <p>
        {LEGAL.productName} is operated by {LEGAL.company} (“we”, “us”). By creating an account or using{" "}
        {LEGAL.productName} you agree to these terms and to our <Link href="/privacy">Privacy Policy</Link>.
        If you use the service on behalf of a business, you confirm that you can bind that business to
        these terms. If you do not agree, do not use the service.
      </p>

      <h2>2. What the service does</h2>
      <p>
        {LEGAL.productName} searches public Reddit posts and comments that match the keywords and
        subreddits you choose, uses artificial intelligence to estimate how relevant each result is to
        your product, and drafts suggested replies. It does not post to Reddit and it does not access
        your Reddit account. You decide whether, where and how to use any draft.
      </p>

      <h2>3. Your account</h2>
      <ul>
        <li>You must be at least 18 years old.</li>
        <li>You must give accurate information and keep your password secure.</li>
        <li>You are responsible for everything that happens under your account.</li>
        <li>Tell us promptly at {LEGAL.email} if you suspect unauthorized use.</li>
      </ul>

      <h2>4. Plans, billing and cancellation</h2>
      <ul>
        <li>
          You can create an account and set up a project without paying. Running scans requires an
          active paid plan, and each plan has a limit on the number of projects.
        </li>
        <li>
          Paid plans are billed monthly in advance through Stripe and renew automatically until you
          cancel. The price is shown at checkout. Taxes may apply.
        </li>
        <li>
          You can cancel at any time from the Billing page. Cancellation takes effect at the end of the
          current billing period, and you keep access until then.
        </li>
        <li>
          Fees are non-refundable except where the law requires otherwise or where we agree in writing.
        </li>
        <li>
          If a payment fails, scanning may be paused until you update your payment method.
        </li>
        <li>
          We may change prices or plan limits. We will tell you in advance, and a change applies from
          your next billing period.
        </li>
      </ul>

      <h2>5. Acceptable use</h2>
      <p>
        You agree to follow the Reddit User Agreement, Reddit content policy and the rules of every
        subreddit where you post. You also agree not to:
      </p>
      <ul>
        <li>post spam or repetitive promotional content;</li>
        <li>hide your affiliation when you promote your own product or service;</li>
        <li>impersonate another person or pretend to be an independent customer;</li>
        <li>make false or misleading claims in replies;</li>
        <li>harass, target or build profiles of individuals;</li>
        <li>manipulate votes or use extra accounts to avoid bans or restrictions;</li>
        <li>scrape, resell or redistribute data from the service;</li>
        <li>break the law, interfere with the service, or bypass its limits or security.</li>
      </ul>

      <h2>6. AI-generated drafts</h2>
      <p>
        Relevance scores and drafted replies are produced by AI and can be wrong, out of context or
        inappropriate. A high score is an estimate, not a promise of a sale. Review and edit every draft
        before you post it. You are solely responsible for what you post and for any consequences,
        including removal of your content or restrictions on your account by Reddit or by a community.
      </p>

      <h2>7. Reddit and other third parties</h2>
      <p>
        {LEGAL.productName} is not affiliated with or endorsed by Reddit. Reddit content belongs to its
        authors and to Reddit. The service depends on access to the Reddit API, which Reddit can change,
        limit or end at any time. We are not liable for interruptions or reduced functionality that
        result, and we may change features in response. Payments are processed by Stripe and AI features
        use OpenAI, each under its own terms.
      </p>

      <h2>8. Your content</h2>
      <p>
        You keep ownership of what you submit, such as product descriptions, keywords and your edits to
        drafts. You give us a limited license to host and process that content only to run the service
        for you, including sending the relevant text to our AI provider. Content collected from Reddit
        remains the property of its owners and is stored only for your use.
      </p>

      <h2>9. Our property</h2>
      <p>
        The service, its software and its design belong to us. While your account is active we grant
        you a limited, non-exclusive, non-transferable right to use it under these terms.
      </p>

      <h2>10. Availability and changes</h2>
      <p>
        We work to keep the service running, but we do not guarantee uninterrupted availability, and
        scans may miss relevant posts. We may add, change or remove features.
      </p>

      <h2>11. Suspension and termination</h2>
      <p>
        We may suspend or end your access if you break these terms, do not pay, abuse the service, or
        put the service or other people at risk. You can stop using the service at any time and ask us to
        delete your account. Sections that by their nature should continue, such as those on liability
        and payment, continue after termination.
      </p>

      <h2>12. Disclaimer</h2>
      <p>
        To the extent the law allows, the service is provided “as is” and “as available”, without
        warranties of any kind, including merchantability, fitness for a particular purpose and
        non-infringement. We do not guarantee any number of leads, any revenue, or that your replies will
        stay visible on Reddit.
      </p>

      <h2>13. Limit of liability</h2>
      <p>
        To the extent the law allows, we are not liable for indirect, incidental, special or
        consequential losses, or for lost profits, revenue, data or goodwill. Our total liability for any
        claim is limited to the amount you paid us in the 12 months before the event that led to the
        claim. Nothing in these terms excludes liability that cannot be excluded by law, or limits
        consumer rights that cannot be waived.
      </p>

      <h2>14. Indemnity</h2>
      <p>
        To the extent the law allows, you will cover us against claims and costs that arise from your
        content, your posts on Reddit, or your breach of these terms.
      </p>

      <h2>15. Changes to these terms</h2>
      <p>
        We may update these terms. For material changes we will give notice by email or in the app
        before they take effect where reasonably possible. If you keep using the service after a change
        takes effect, you accept the updated terms.
      </p>

      <h2>16. Governing law</h2>
      <p>
        These terms are governed by the law of {LEGAL.governingLaw}. If you are a consumer, you keep the
        mandatory consumer protections of the country where you live.
      </p>

      <h2>17. Contact</h2>
      <p>
        {LEGAL.company}, {LEGAL.address}. Email: <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>
      </p>
    </LegalShell>
  );
}
