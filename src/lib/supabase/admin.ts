// src/lib/supabase/admin.ts
// service role: يتجاوز RLS. للسيرفر فقط (webhooks / cron). لا تستورده في مكوّن عميل أبدًا.
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
