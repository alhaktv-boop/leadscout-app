// src/app/api/projects/[id]/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { ProjectInput } from "@/lib/validation";

const UpdateInput = ProjectInput.extend({ is_active: z.boolean() });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in first" }, { status: 401 });

  const parsed = UpdateInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  // RLS تمنع تعديل مشاريع الآخرين
  const { data, error } = await supabase
    .from("projects").update(parsed.data).eq("id", id).select("id").single();
  if (error || !data) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  return NextResponse.json({ id: data.id });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in first" }, { status: 401 });

  const { data, error } = await supabase
    .from("projects").delete().eq("id", id).select("id").single();
  if (error || !data) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
