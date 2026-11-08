-- قائمة انتظار لاختبار الاهتمام بفكرة جديدة (بدون بيانات حساسة)
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  product text not null default 'tube',
  channel_topic text,
  created_at timestamptz not null default now(),
  unique (email, product)
);
alter table public.waitlist enable row level security;
-- لا سياسات: الكتابة والقراءة عبر service role من السيرفر فقط
