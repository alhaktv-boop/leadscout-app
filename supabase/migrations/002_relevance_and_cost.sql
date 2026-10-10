-- supabase/migrations/002_relevance_and_cost.sql
-- شغّله مرة واحدة في Supabase Dashboard > SQL Editor، قبل نشر الكود الجديد.

-- 1) كلمات استبعاد لكل مشروع (تحسين الدقة)
alter table public.projects
  add column if not exists exclude_keywords text[] not null default '{}';

-- 2) ذاكرة العناصر التي حُلّلت سابقًا: تمنع إعادة تقييم نفس المنشور وإنفاق OpenAI مرة ثانية.
--    تخزّن المعرّف والنتيجة فقط، لا نص ولا اسم مستخدم.
create table if not exists public.scanned_items (
  project_id uuid not null references public.projects(id) on delete cascade,
  reddit_id  text not null,
  score      int,
  seen_at    timestamptz not null default now(),
  primary key (project_id, reddit_id)
);
create index if not exists scanned_items_seen_at_idx on public.scanned_items (seen_at);

-- RLS مفعّل بلا سياسات = لا وصول للمستخدمين. الكتابة والقراءة عبر service role فقط.
alter table public.scanned_items enable row level security;

-- 3) تتبع التكلفة لكل فحص
alter table public.scan_runs
  add column if not exists prompt_tokens     int not null default 0,
  add column if not exists completion_tokens int not null default 0,
  add column if not exists skipped_count     int not null default 0; -- استُبعد قبل الوصول للذكاء الاصطناعي
