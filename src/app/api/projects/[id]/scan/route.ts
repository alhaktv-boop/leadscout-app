// src/app/api/projects/[id]/scan/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scanProject } from "@/lib/scan";
import { getSubscription, isActiveStatus } from "@/lib/subscription";

export const maxDuration = 120;

const COOLDOWN_MS = 10 * 60 * 1000; // يحمي من استنزاف رصيد OpenAI وحدود Reddit

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in first" }, { status: 401 });

  const sub = await getSubscription(supabase, user.id);
  if (!isActiveStatus(sub?.status)) {
    return NextResponse.json(
      { error: "Scanning needs an active plan. Pick one on the Billing page." },
      { status: 402 }
    );
  }

  // RLS تضمن أن المشروع يخص هذا المستخدم
  const { data: project } = await supabase.from("projects").select("id").eq("id", id).single();
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const since = new Date(Date.now() - COOLDOWN_MS).toISOString();
  const { count } = await supabase
    .from("scan_runs").select("id", { count: "exact", head: true })
    .eq("project_id", id).gte("started_at", since);
  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: "Scanned a few minutes ago. Try again in 10 minutes." }, { status: 429 });
  }

  const result = await scanProject(id);
  return NextResponse.json(result);
}
