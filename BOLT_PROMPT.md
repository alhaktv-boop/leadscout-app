# LeadScout: Bolt prompt pack

How to use:
1. Paste the **Master prompt** into Bolt first.
2. Paste **Phase 1 to 7** one at a time. Wait for each to work before sending the next.
3. The SQL blocks at the end go in Supabase (SQL Editor), not in Bolt.
4. The Stripe webhook and the daily scan need a public URL, so test them after deploying (Vercel), not inside Bolt's preview.

---

## Master prompt (paste first)

Build "LeadScout", a SaaS that finds Reddit posts and comments where people are asking for what a customer sells, scores each one with AI, and drafts a helpful non-spammy reply the customer can copy and post themselves. It never posts to Reddit.

Stack: Next.js 15 (App Router, TypeScript), Tailwind CSS, shadcn/ui, Supabase (Postgres + Auth + Row Level Security), OpenAI API (gpt-4o-mini), Stripe subscriptions, deployed on Vercel. Packages: @supabase/supabase-js, @supabase/ssr, openai, zod, stripe, sonner.

Rules for the whole project:
- All UI text in English, sentence case, plain verbs. Buttons say what they do ("Copy reply", "Save changes"). Errors say what went wrong and how to fix it.
- Never put JSX text with raw apostrophes; rephrase or use &apos;.
- Server-only secrets (service role key, Stripe secret, OpenAI key, Reddit secret) are never exposed to the browser.
- Every API route checks the signed-in user with supabase.auth.getUser() and relies on RLS.
- Zod validates every request body.

Pages: / (landing), /login, /terms, /privacy, /dashboard (lead inbox), /dashboard/projects/new, /dashboard/projects/[id] (edit), /dashboard/billing, /dashboard/account.

Data model: see the SQL at the end of this file. Use exactly those tables.

Environment variables:
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY, REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USER_AGENT, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_STARTER, STRIPE_PRICE_PRO, NEXT_PUBLIC_APP_URL, CRON_SECRET.

Start with Phase 1 only. Do not build the other phases yet.

---

## Phase 1: Setup, auth, protection

Set up the project and Supabase auth:
- src/lib/supabase/server.ts (createServerClient with cookies, Next 15 async cookies()), client.ts (createBrowserClient), admin.ts (service role client, server only, persistSession false).
- src/middleware.ts: refresh the session and redirect unauthenticated users from /dashboard/* to /login. Matcher only /dashboard/:path*.
- /login page: email + password, toggle between sign in and create account. After signup without session show "Check your inbox to confirm your email". Under the signup form show a line linking /terms and /privacy.
- POST /auth/signout route that signs out and redirects to /login with status 303.
- /dashboard layout: header with product name, a nav listing the user's projects (links to /dashboard?p=<id>), links "New project", "Billing", "Account", a Sign out button, and a sonner Toaster.
- Root / page: temporary redirect to /dashboard.

---

## Phase 2: Project form and lead inbox

- Shared zod schema in src/lib/validation.ts: name (1-80), product_description (20-1500), brand_name (optional, max 60), keywords (1-15 strings, 2-60 chars), exclude_keywords (0-15, default []), subreddits (1-10, strip a leading "r/", regex ^[A-Za-z0-9_]{2,21}$), min_score (0-100, default 60).
- TagInput component: Enter or comma adds a tag, Backspace removes the last, dedupe case-insensitively, optional prefix like "r/", shows count/max.
- ProjectForm component used for create and edit: fields name, product description (with counter), brand name (hint: replies disclose affiliation), keywords, subreddits, words to exclude, minimum relevance slider 30-95 step 5 (hint: changes apply to new posts only), and on edit a checkbox "Scan this project automatically". POST /api/projects (create) and PATCH/DELETE /api/projects/[id].
- /dashboard/projects/new and /dashboard/projects/[id] pages. The edit page has a Delete project button with a confirm dialog.
- POST /api/projects limits the number of projects by plan: 1 for users without an active subscription, otherwise the plan limit.
- /dashboard inbox (server component): picks the project from ?p=, filter tabs New / Copied / Replied / All via ?status=, leads ordered by score desc then created_at desc, limit 100, excluding dismissed. Shows the last scan time, leads created and any error. Empty state explains what to do.
- LeadCard component: a colored left bar by score (>=80 green, >=60 amber, else grey), "r/sub, post or comment, by u/author, time ago", "NN% match", title, body excerpt with Show more, intent label and reason, an editable textarea for the suggested reply, buttons: Copy reply (copies the textarea, saves edits, sets status copied), Open on Reddit (new tab), Mark as replied, Dismiss. Use optimistic updates with rollback on error.
- PATCH /api/leads/[id] accepting status and/or draft_reply.
- ScanButton: POST /api/projects/[id]/scan, toast "Checked N new items, found M leads", then router.refresh().

---

## Phase 3: Scan pipeline (most important)

Create these files exactly as described.

**src/lib/reddit.ts**: Reddit OAuth app-only (client_credentials, token cached until 1 minute before expiry) using fetch with the User-Agent from REDDIT_USER_AGENT. No snoowrap or PRAW.
- fetchPosts(subreddit, keywords, limit 50): GET /r/{sub}/search with q = keywords quoted and joined by OR, restrict_sr=1, sort=new, t=day, include_over_18=off.
- fetchRecentComments(subreddit, limit 100): GET /r/{sub}/comments, no keyword filtering.
- Return RedditItem { redditId (fullname), kind post|comment, subreddit, author, title (thread title for comments), body, permalink (full URL), createdAt, flags { stickied, over18, locked, archived } }.
- On HTTP 429 throw an error mentioning retry-after.

**src/lib/filters.ts**: prefilter(items, { keywords, exclude_keywords }) returns { kept, skipped }. Skip when:
- body is [deleted] or [removed], or an empty comment;
- author missing, [deleted], AutoModerator, or ends with bot;
- stickied, over18, locked or archived;
- text shorter than 25 chars (post) or 40 chars (comment);
- comment body does not match a keyword (match at word start, case-insensitive, unicode-aware, phrases allow flexible whitespace);
- text matches an excluded word;
- comment does not look like a question or need (regex: ?, looking for, recommend, suggest, alternative, any tool/app/software/service, which tool/app/software, how do/can/should/to, struggl, need a/an/some/help, wish there/I, frustrat, can anyone, does anyone, anyone know/use/tried);
- duplicate normalized text (first 300 chars, lowercased, collapsed whitespace).

**src/lib/ai.ts**: two stages with gpt-4o-mini, OpenAI client created lazily.
- scoreBatch(items, project): one request for up to 8 items, temperature 0, response_format json_schema strict returning { results: [{ id, score 0-100, intent, reason }] }. Truncate each text to 700 chars and each title to 200. Validate with zod (clamp score, intent falls back to "other"). Return a Map by index plus token usage. Use the SCORE prompt below verbatim.
- draftReply(item, project, { intent, reason }): temperature 0.6, max_tokens 350, plain text output, text up to 2000 chars. Use the DRAFT prompt below verbatim. If the model outputs SKIP or nothing, draft is null.

**src/lib/scan.ts**: scanProject(projectId) with the service role client:
1. Fetch posts and comments for every subreddit (one failing subreddit must not stop the others); dedupe by redditId.
2. Drop ids already in scanned_items or leads for this project (query in chunks of 150 ids).
3. Run prefilter. Count skipped.
4. Sort posts first, then newest; cap at 150 items per scan.
5. Score in batches of 8, 3 batches in parallel. A failed batch is logged and its items are NOT marked as seen so they retry later.
6. Keep items with score >= project.min_score. Draft replies only for those (5 in parallel). If drafting fails, still save the lead with a null draft.
7. Upsert leads (onConflict project_id,reddit_id, ignoreDuplicates).
8. Upsert every scored item into scanned_items (if saving leads failed, do not mark the passing ones).
9. Delete scanned_items older than 14 days for the project.
10. Update scan_runs with fetched_count, scored_count, leads_created, skipped_count, prompt_tokens, completion_tokens and any error.

**POST /api/projects/[id]/scan**: requires sign-in, an active subscription (402 otherwise: "Scanning needs an active plan. Pick one on the Billing page."), project ownership via RLS, and a 10-minute cooldown per project (429). Then calls scanProject.

**GET /api/cron/scan**: requires header Authorization: Bearer CRON_SECRET. Scans every active project whose owner has subscription status active or trialing. vercel.json: crons path /api/cron/scan, schedule "0 7 * * *".

### SCORE prompt (use verbatim as the system message)

```
You qualify Reddit posts and comments as sales leads for ONE product.

Score each item from 0 to 100: how likely its author would genuinely benefit from the product, judged from the text alone.
- 85-100: explicitly asks for a tool, service or recommendation the product fits, or says they are about to buy or switch
- 65-84: describes a concrete, current problem the product solves and seems open to solutions
- 40-64: loosely related, vague need, or no clear ask
- 0-39: unrelated; venting with no ask; already solved or already chose a solution; giving advice rather than seeking it; jobs or hiring; memes or news; the author is promoting their own product or a competitor; asks for something the product cannot do

Rules:
- Judge the author's need, not whether the text merely contains a keyword.
- Be conservative: when unsure, score below 60.
- reason: one short sentence (max 20 words) quoting or naming the evidence in the text.
- intent: buying_intent, asking_recommendation, complaint or other.

Return JSON {"results":[{"id":int,"score":int,"intent":"...","reason":"..."}]} with exactly one entry per input id.
```

User message: `PRODUCT: <product_description>` then `ITEMS:` and each item as `[id N] r/<subreddit> (<kind>)`, `Title: ...` (or `Thread: ...` for comments), `Text: ...`.

### DRAFT prompt (use verbatim as the system message)

```
You draft a Reddit reply for a person who wants to help, and who may mention their own product.

Rules:
- Sound like a thoughtful community member, not a marketer. 2-5 sentences, plain text, no emojis, no hashtags, no markdown headings.
- Start with something useful for the author's actual problem: a concrete tip, a step, or a question that moves them forward.
- Mention the product at most once, only if it genuinely fits, in a low-key way. If it does not fit, do not mention it.
- If a brand name is given and you mention the product, say plainly that you work on it or built it (for example "I work on X"). If no brand name is given, do not mention the product by name.
- Never invent personal experiences, customer stories, credentials, statistics, features or links.
- Do not claim to be a customer of the product. No pressure, no urgency.
- Reply in the language of the original text.
- Output only the reply text. If no genuinely helpful reply is possible, output exactly: SKIP
```

User message: PRODUCT, BRAND (or "(none)"), SUBREDDIT, TITLE or THREAD, TEXT, WHY IT IS A LEAD (the scoring reason).

---

## Phase 4: Stripe subscriptions

- src/lib/plans.ts: PLANS { starter: { name, priceId from STRIPE_PRICE_STARTER, priceLabel, maxProjects 1, blurb, features }, pro: { ..., STRIPE_PRICE_PRO, maxProjects 5 } }, FREE_MAX_PROJECTS = 1, planFromPriceId().
- src/lib/stripe.ts: lazy getStripe() and appUrl(req).
- src/lib/subscription.ts: getSubscription(), isActiveStatus (active or trialing), maxProjectsFor().
- POST /api/stripe/checkout { plan }: sign-in required; reuse or create the Stripe customer (store stripe_customer_id in subscriptions with the service role); if the user already has a subscription in active/trialing/past_due/unpaid return 409 "use Manage billing"; create a Checkout Session in subscription mode with client_reference_id = user id, allow_promotion_codes, subscription_data.metadata.user_id, success_url /dashboard/billing?checkout=success, cancel_url /dashboard/billing.
- POST /api/stripe/portal: creates a billing portal session for the stored customer.
- POST /api/stripe/webhook (nodejs runtime, raw body, verify signature). Handle checkout.session.completed and customer.subscription.created/updated/deleted. In every case fetch the latest subscription from Stripe by id, find the user (metadata.user_id, then client_reference_id, then stripe_customer_id lookup), and upsert subscriptions { user_id, stripe_customer_id, stripe_subscription_id, plan (free when canceled), status, current_period_end, updated_at } on user_id. Read current_period_end from the first subscription item, falling back to the subscription. Ignore resource_missing from Stripe and foreign key violation 23503 (deleted user). Return 500 on other errors so Stripe retries.
- /dashboard/billing: current plan with renewal date and a Manage billing button, or two plan columns with Choose buttons; a success banner after checkout; a warning banner when status is past_due or unpaid.

---

## Phase 5: Landing, terms, privacy

- Landing page at /: left-aligned, one font family (Schibsted Grotesk), colors paper #F2F4F3, ink #0E2430, muted #4A5B63, line #D3DAD9, accent #3347E0. Hero: headline "Find the Reddit threads where people are already asking for what you sell", subtext, a primary button and a pricing link, and next to it an interactive example lead card (labelled as an invented example, with a working Copy reply button). Sections: How it works (3 numbered steps), Replies that read like a person wrote them (5 plain rules), Pricing (from PLANS, one bordered two-column block), FAQ (details elements), final call to action, footer with Terms, Privacy and Sign in. Show "Open dashboard" instead of "Sign in" when the visitor is logged in. No fake testimonials, user counts or statistics.
- src/lib/legal.ts with company, email, address, governingLaw, effectiveDate. /terms and /privacy pages that read from it, written without apostrophes in JSX. Terms cover: service description (it never posts to Reddit), 18+, plans and cancellation, acceptable use (follow Reddit rules, no undisclosed promotion, no impersonation), AI drafts disclaimer, Reddit not affiliated, liability limits, governing law. Privacy covers: data collected, essential cookies only, legal bases, Reddit users' public data and a removal-on-request path, AI processing through OpenAI, processors (Supabase, Vercel, OpenAI, Stripe, Reddit), transfers, retention, security, rights, children, changes.

---

## Phase 6: Account export and deletion

- GET /api/account/export: JSON download of the user's account, subscription, projects, leads and scan_runs (paginate in pages of 1000).
- DELETE /api/account { confirm: email }: requires the typed email to match. First delete the Stripe customer (this cancels subscriptions); if that fails (other than resource_missing) stop and delete nothing. Then admin.auth.admin.deleteUser(user.id) (all tables cascade), then signOut with scope local.
- /dashboard/account: signed-in email, a Download my data button, and a Delete account section where the button stays disabled until the user types their email.

---

## Phase 7: Deploy

Add vercel.json with the cron, .env.example with every variable, and a README with: run the SQL, create the Stripe products and customer portal, add the webhook endpoint https://<domain>/api/stripe/webhook (events: checkout.session.completed, customer.subscription.created, customer.subscription.updated, customer.subscription.deleted), set env vars on Vercel, then redeploy.

---

## SQL 1: schema (run first in Supabase)

```sql
create extension if not exists "pgcrypto";

create table public.projects (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  product_description text not null,
  brand_name    text,
  keywords      text[] not null default '{}',
  subreddits    text[] not null default '{}',
  min_score     int not null default 60 check (min_score between 0 and 100),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);
create index on public.projects (user_id);

create type lead_status as enum ('new', 'copied', 'replied', 'dismissed');
create type lead_kind   as enum ('post', 'comment');

create table public.leads (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  reddit_id     text not null,
  kind          lead_kind not null,
  subreddit     text not null,
  author        text,
  title         text,
  body          text,
  permalink     text not null,
  reddit_created_at timestamptz not null,
  score         int not null check (score between 0 and 100),
  intent        text,
  reason        text,
  draft_reply   text,
  status        lead_status not null default 'new',
  created_at    timestamptz not null default now(),
  unique (project_id, reddit_id)
);
create index on public.leads (project_id, status, score desc);
create index on public.leads (project_id, created_at desc);

create table public.subscriptions (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id   text unique,
  stripe_subscription_id text unique,
  plan                 text not null default 'free',
  status               text not null default 'inactive',
  current_period_end   timestamptz,
  updated_at           timestamptz not null default now()
);

create table public.scan_runs (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  started_at    timestamptz not null default now(),
  fetched_count int not null default 0,
  scored_count  int not null default 0,
  leads_created int not null default 0,
  error         text
);

alter table public.projects      enable row level security;
alter table public.leads         enable row level security;
alter table public.subscriptions enable row level security;
alter table public.scan_runs     enable row level security;

create policy "projects: owner full access" on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "leads: owner via project" on public.leads
  for all using (exists (select 1 from public.projects p
                         where p.id = leads.project_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.projects p
                      where p.id = leads.project_id and p.user_id = auth.uid()));

create policy "subscriptions: owner read" on public.subscriptions
  for select using (auth.uid() = user_id);

create policy "scan_runs: owner read" on public.scan_runs
  for select using (exists (select 1 from public.projects p
                            where p.id = scan_runs.project_id and p.user_id = auth.uid()));
```

## SQL 2: relevance and cost (run second)

```sql
alter table public.projects
  add column if not exists exclude_keywords text[] not null default '{}';

create table if not exists public.scanned_items (
  project_id uuid not null references public.projects(id) on delete cascade,
  reddit_id  text not null,
  score      int,
  seen_at    timestamptz not null default now(),
  primary key (project_id, reddit_id)
);
create index if not exists scanned_items_seen_at_idx on public.scanned_items (seen_at);
alter table public.scanned_items enable row level security;

alter table public.scan_runs
  add column if not exists prompt_tokens     int not null default 0,
  add column if not exists completion_tokens int not null default 0,
  add column if not exists skipped_count     int not null default 0;
```

## Terminal commands (only if you work outside Bolt)

```bash
npx create-next-app@latest leadscout --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd leadscout
npx shadcn@latest init
npx shadcn@latest add button card input textarea badge tabs dialog sonner
npm i @supabase/supabase-js @supabase/ssr openai zod stripe
```
