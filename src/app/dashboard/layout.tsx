// src/app/dashboard/layout.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects").select("id, name").order("created_at");

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <Link href="/dashboard" className="font-semibold tracking-tight">LeadScout</Link>
          <nav className="flex flex-1 flex-wrap items-center gap-1 text-sm">
            {(projects ?? []).map((p) => (
              <Link key={p.id} href={`/dashboard?p=${p.id}`}
                    className="rounded px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                {p.name}
              </Link>
            ))}
            <Link href="/dashboard/projects/new"
                  className="rounded px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground">
              New project
            </Link>
            <Link href="/dashboard/billing"
                  className="rounded px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground">
              Billing
            </Link>
            <Link href="/dashboard/account"
                  className="rounded px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground">
              Account
            </Link>
          </nav>
          <form action="/auth/signout" method="post">
            <Button variant="ghost" size="sm" type="submit">Sign out</Button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
      <Toaster />
    </div>
  );
}
