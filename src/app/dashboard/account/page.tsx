// src/app/dashboard/account/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { DeleteAccountForm } from "@/components/delete-account-form";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Signed in as {user.email}</p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-medium">Download your data</h2>
        <p className="text-sm text-muted-foreground">
          Get a JSON file with your projects, leads, scan history and subscription details.
        </p>
        <div>
          <Button variant="outline" asChild>
            <a href="/api/account/export" download>Download my data</a>
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-3 border-t pt-6">
        <h2 className="font-medium text-red-600">Delete account</h2>
        <p className="max-w-xl text-sm text-muted-foreground">
          This permanently deletes your account, projects, leads and scan history, and cancels your
          subscription right away. Stripe may keep payment records as the law requires. You cannot undo
          this, so download your data first if you want a copy.
        </p>
        <DeleteAccountForm email={user.email ?? ""} />
      </section>
    </div>
  );
}
