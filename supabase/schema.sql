-- ============================================================
-- LeadScout MVP - Supabase schema
-- شغّله في: Supabase Dashboard > SQL Editor
-- ============================================================

create extension if not exists "pgcrypto";

-- 1) Projects: كل مستخدم يمكن أن يملك أكثر من منتج/حملة
create table public.projects (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  product_description text not null,          -- وصف المنتج/الخدمة (يُمرَّر للذكاء الاصطناعي)
  brand_name    text,                         -- يُستخدم للإفصاح عن الانتماء في الرد
  keywords      text[] not null default '{}', -- الكلمات المفتاحية
  subreddits    text[] not null default '{}', -- بدون r/
  min_score     int not null default 60 check (min_score between 0 and 100),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);
create index on public.projects (user_id);

-- 2) Leads: الفرص المكتشفة
create type lead_status as enum ('new', 'copied', 'replied', 'dismissed');
create type lead_kind   as enum ('post', 'comment');

create table public.leads (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  reddit_id     text not null,               -- fullname مثل t3_xxx أو t1_xxx
  kind          lead_kind not null,
  subreddit     text not null,
  author        text,
  title         text,
  body          text,
  permalink     text not null,
  reddit_created_at timestamptz not null,
  score         int not null check (score between 0 and 100),
  intent        text,                        -- buying_intent | asking_recommendation | complaint | other
  reason        text,                        -- لماذا هذا العميل مهم (من الـ AI)
  draft_reply   text,
  status        lead_status not null default 'new',
  created_at    timestamptz not null default now(),
  unique (project_id, reddit_id)             -- يمنع التكرار
);
create index on public.leads (project_id, status, score desc);
create index on public.leads (project_id, created_at desc);

-- 3) Subscriptions: مزامنة من Stripe webhooks
create table public.subscriptions (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id   text unique,
  stripe_subscription_id text unique,
  plan                 text not null default 'free',   -- free | starter | pro
  status               text not null default 'inactive', -- active | past_due | canceled ...
  current_period_end   timestamptz,
  updated_at           timestamptz not null default now()
);

-- 4) Scan runs: سجل الفحوصات (للمراقبة وتتبع التكلفة)
create table public.scan_runs (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  started_at    timestamptz not null default now(),
  fetched_count int not null default 0,
  scored_count  int not null default 0,
  leads_created int not null default 0,
  error         text
);

-- ============================================================
-- Row Level Security
-- ============================================================
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
  for select using (auth.uid() = user_id);   -- الكتابة فقط عبر service role (webhook)

create policy "scan_runs: owner read" on public.scan_runs
  for select using (exists (select 1 from public.projects p
                            where p.id = scan_runs.project_id and p.user_id = auth.uid()));
