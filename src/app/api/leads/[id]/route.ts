// src/app/api/leads/[id]/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const Body = z
  .object({
    status: z.enum(["new", "copied", "replied", "dismissed"]).optional(),
    draft_reply: z.string().max(5000).optional(),
  })
  .refine((b) => Object.keys(b).length > 0, "Nothing to update");

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in first" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  // RLS تمنع تعديل فرص مشاريع الآخرين
  const { data, error } = await supabase
    .from("leads").update(parsed.data).eq("id", id).select("id").single();

  if (error || !data) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
