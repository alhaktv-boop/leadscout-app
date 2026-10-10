// src/app/dashboard/page.tsx  — Lead Inbox
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LeadCard, type Lead } from "@/components/lead-card";
import { ScanButton } from "@/components/scan-button";

const FILTERS = [
  { key: "new", label: "New" },
  { key: "copied", label: "Copied" },
  { key: "replied", label: "Replied" },
  { key: "all", label: "All" },
] as const;

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects").select("id, name, keywords, subreddits").order("created_at");
  if (!projects?.length) redirect("/dashboard/projects/new");

  const project = projects.find((p) => p.id === sp.p) ?? projects[0];
  const status = FILTERS.some((f) => f.key === sp.status) ? sp.status! : "new";

  let query = supabase
    .from("leads").select("*")
    .eq("project_id", project.id)
    .neq("status", "dismissed")
    .order("score", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);
  if (status !== "all") query = query.eq("status", status);

  const [{ data: leads }, { data: lastRun }] = await Promise.all([
    query,
    supabase.from("scan_runs").select("started_at, leads_created, error")
      .eq("project_id", project.id).order("started_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const list = (leads ?? []) as Lead[];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {lastRun
              ? `Last scan ${new Date(lastRun.started_at).toLocaleString("en-GB")} · ${lastRun.leads_created} new leads`
              : "No scan yet."}
            {lastRun?.error && <span className="text-red-600"> · Last scan failed: {lastRun.error}</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/projects/${project.id}`}
                className="text-sm text-muted-foreground underline hover:text-foreground">
            Edit project
          </Link>
          <ScanButton projectId={project.id} />
        </div>
      </div>

      <nav className="flex gap-1 border-b text-sm" aria-label="Lead status">
        {FILTERS.map((f) => (
          <Link key={f.key} href={`/dashboard?p=${project.id}&status=${f.key}`}
                aria-current={status === f.key ? "page" : undefined}
                className={`-mb-px border-b-2 px-3 py-2 ${
                  status === f.key ? "border-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}>
            {f.label}
          </Link>
        ))}
      </nav>

      {list.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="font-medium">No leads here yet</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            {status === "new"
              ? `Scan now to check r/${project.subreddits.slice(0, 3).join(", r/")} for your keywords. If nothing matches, lower the minimum relevance or add broader keywords.`
              : "Leads you mark this way will show up here."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {list.map((lead) => <LeadCard key={lead.id} lead={lead} />)}
        </div>
      )}
    </div>
  );
}
