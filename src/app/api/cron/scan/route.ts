// src/app/api/cron/scan/route.ts
// يُستدعى من Vercel Cron (مثلاً كل ساعتين). محمي بسرّ في الـ Header.
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { scanProject } from "@/lib/scan";

export const maxDuration = 300;

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // فقط مشاريع المشتركين النشطين
  const { data: projects } = await admin
    .from("projects")
    .select("id, user_id, subscriptions!inner(status)")
    .eq("is_active", true)
    .in("subscriptions.status", ["active", "trialing"]);

  const results = [];
  for (const p of projects ?? []) {
    results.push({ project: p.id, ...(await scanProject(p.id)) });
  }
  return NextResponse.json({ results });
}
