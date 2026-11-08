// src/app/api/waitlist/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: Request) {
  let body: { email?: unknown; topic?: unknown; website?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (body.website) return NextResponse.json({ ok: true }); // honeypot للروبوتات

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const topic = typeof body.topic === "string" ? body.topic.trim().slice(0, 120) : null;
  if (!EMAIL.test(email) || email.length > 200) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const { error } = await createAdminClient()
    .from("waitlist")
    .upsert({ email, product: "tube", channel_topic: topic || null }, { onConflict: "email,product", ignoreDuplicates: true });
  if (error) {
    console.error("[waitlist]", error.message);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
