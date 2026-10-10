// src/app/api/account/export/route.ts
// تصدير بيانات المستخدم كملف JSON (حق النقل في GDPR). يعمل بصلاحيات المستخدم، فتحميه RLS.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PAGE = 1000; // الحد الافتراضي لصفوف PostgREST في الطلب الواحد

async function fetchAll(
  build: (from: number, to: number) => PromiseLike<{ data: unknown[] | null; error: unknown }>
) {
  const rows: unknown[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in first" }, { status: 401 });

  try {
    const projects = (await fetchAll((a, b) =>
      supabase.from("projects").select("*").order("created_at").range(a, b)
    )) as { id: string }[];
    const ids = projects.map((p) => p.id);

    const [leads, scanRuns, subscription] = await Promise.all([
      ids.length
        ? fetchAll((a, b) =>
            supabase.from("leads").select("*").in("project_id", ids).order("created_at").range(a, b))
        : [],
      ids.length
        ? fetchAll((a, b) =>
            supabase.from("scan_runs").select("*").in("project_id", ids).order("started_at").range(a, b))
        : [],
      supabase.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle().then((r) => r.data),
    ]);

    const payload = {
      exported_at: new Date().toISOString(),
      account: { id: user.id, email: user.email, created_at: user.created_at },
      subscription,
      projects,
      leads,
      scan_runs: scanRuns,
    };

    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="leadscout-export-${new Date().toISOString().slice(0, 10)}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[export]", e);
    return NextResponse.json({ error: "Could not export your data. Try again." }, { status: 500 });
  }
}
