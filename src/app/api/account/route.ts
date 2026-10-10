// src/app/api/account/route.ts
// حذف الحساب نهائيًا: Stripe أولًا (حتى لا تستمر الفوترة)، ثم Supabase.
// حذف المستخدم من auth يحذف تلقائيًا مشاريعه وفرصه وسجل الفحص واشتراكه (on delete cascade).
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

const Body = z.object({ confirm: z.string() });

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in first" }, { status: 401 });

  const email = (user.email ?? "").trim().toLowerCase();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success || !email || parsed.data.confirm.trim().toLowerCase() !== email) {
    return NextResponse.json({ error: "Type your email address exactly to confirm." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("subscriptions").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();

  // حذف العميل في Stripe يلغي اشتراكاته فورًا. إن فشل لا نحذف شيئًا كي لا يبقى مشترك بلا حساب.
  if (sub?.stripe_customer_id) {
    try {
      await getStripe().customers.del(sub.stripe_customer_id);
    } catch (e) {
      if ((e as { code?: string }).code !== "resource_missing") {
        console.error("[delete account] stripe", e);
        return NextResponse.json(
          { error: "We could not cancel your subscription, so nothing was deleted. Try again, or email us." },
          { status: 502 }
        );
      }
    }
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("[delete account] supabase", error);
    return NextResponse.json(
      { error: "Your subscription was cancelled, but we could not finish deleting your data. Email us and we will complete it." },
      { status: 500 }
    );
  }

  await supabase.auth.signOut({ scope: "local" }); // يمسح الكوكيز محليًا دون استدعاء API
  return NextResponse.json({ ok: true });
}
