// src/components/lead-card.tsx
"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export type Lead = {
  id: string;
  kind: "post" | "comment";
  subreddit: string;
  author: string | null;
  title: string | null;
  body: string | null;
  permalink: string;
  reddit_created_at: string;
  score: number;
  intent: string | null;
  reason: string | null;
  draft_reply: string | null;
  status: "new" | "copied" | "replied" | "dismissed";
};

const INTENT_LABEL: Record<string, string> = {
  buying_intent: "Looking to buy",
  asking_recommendation: "Asking for a recommendation",
  complaint: "Complaining about a problem",
  other: "Related",
};

// الشريط الجانبي يرمّز قوة الفرصة: لا زخرفة، بل معلومة
function scoreColor(s: number) {
  if (s >= 80) return "bg-emerald-600";
  if (s >= 60) return "bg-amber-500";
  return "bg-slate-400";
}

function timeAgo(iso: string) {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  return h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
}

async function patchLead(id: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/leads/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Update failed");
}

export function LeadCard({ lead }: { lead: Lead }) {
  const [status, setStatus] = useState(lead.status);
  const [draft, setDraft] = useState(lead.draft_reply ?? "");
  const [expanded, setExpanded] = useState(false);

  if (status === "dismissed") return null;

  const body = lead.body ?? "";
  const long = body.length > 280;
  const shown = expanded || !long ? body : body.slice(0, 280) + "…";

  async function copy() {
    try {
      await navigator.clipboard.writeText(draft);
    } catch {
      return toast.error("Could not copy. Select the text and copy it manually.");
    }
    toast.success("Reply copied");
    try {
      await patchLead(lead.id, {
        draft_reply: draft,
        ...(status === "new" ? { status: "copied" } : {}),
      });
      if (status === "new") setStatus("copied");
    } catch {
      /* النسخ نجح؛ فشل الحفظ غير حرج */
    }
  }

  async function setLeadStatus(next: "replied" | "dismissed") {
    const prev = status;
    setStatus(next);
    try {
      await patchLead(lead.id, { status: next });
      if (next === "replied") toast.success("Marked as replied");
    } catch {
      setStatus(prev);
      toast.error("Could not update the lead");
    }
  }

  return (
    <article className="flex overflow-hidden rounded-lg border">
      <div className={`w-1.5 shrink-0 ${scoreColor(lead.score)}`} aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
        <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p className="text-sm text-muted-foreground">
            r/{lead.subreddit} · {lead.kind === "post" ? "Post" : "Comment"} by u/{lead.author ?? "unknown"} · {timeAgo(lead.reddit_created_at)}
          </p>
          <p className="text-sm font-medium">
            {lead.score}% match
            {status !== "new" && (
              <span className="ml-2 font-normal text-muted-foreground">
                {status === "copied" ? "Copied" : "Replied"}
              </span>
            )}
          </p>
        </header>

        <div>
          {lead.title && <h2 className="font-medium leading-snug">{lead.title}</h2>}
          {body && (
            <p className="mt-1 whitespace-pre-line break-words text-sm text-muted-foreground">
              {shown}{" "}
              {long && (
                <button type="button" className="underline" onClick={() => setExpanded(!expanded)}>
                  {expanded ? "Show less" : "Show more"}
                </button>
              )}
            </p>
          )}
        </div>

        {lead.reason && (
          <p className="text-sm">
            <span className="font-medium">{INTENT_LABEL[lead.intent ?? "other"] ?? "Related"}.</span>{" "}
            {lead.reason}
          </p>
        )}

        {draft !== "" || lead.draft_reply ? (
          <div className="flex flex-col gap-2">
            <label htmlFor={`draft-${lead.id}`} className="text-sm font-medium">Suggested reply</label>
            <Textarea id={`draft-${lead.id}`} rows={5} value={draft} onChange={(e) => setDraft(e.target.value)} />
            <p className="text-xs text-muted-foreground">
              Edit it so it sounds like you before you post. Check the subreddit's rules on self-promotion.
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No reply drafted for this one.</p>
        )}

        <footer className="flex flex-wrap gap-2">
          {draft && <Button size="sm" onClick={copy}>Copy reply</Button>}
          <Button size="sm" variant="outline" asChild>
            <a href={lead.permalink} target="_blank" rel="noopener noreferrer">Open on Reddit</a>
          </Button>
          {status !== "replied" && (
            <Button size="sm" variant="ghost" onClick={() => setLeadStatus("replied")}>Mark as replied</Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => setLeadStatus("dismissed")}>Dismiss</Button>
        </footer>
      </div>
    </article>
  );
}
