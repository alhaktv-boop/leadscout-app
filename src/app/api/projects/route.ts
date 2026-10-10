// src/app/api/projects/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ProjectInput } from "@/lib/validation";
import { getSubscription, maxProjectsFor } from "@/lib/subscription";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in first" }, { status: 401 });

  const parsed = ProjectInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  // حد المشاريع حسب الخطة
  const sub = await getSubscription(supabase, user.id);
  const limit = maxProjectsFor(sub);
  const { count } = await supabase.from("projects").select("id", { count: "exact", head: true });
  if ((count ?? 0) >= limit) {
    return NextResponse.json(
      { error: `Your plan allows ${limit} project${limit === 1 ? "" : "s"}. Upgrade on the Billing page to add more.` },
      { status: 403 }
    );
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({ ...parsed.data, user_id: user.id })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id }, { status: 201 });
}
