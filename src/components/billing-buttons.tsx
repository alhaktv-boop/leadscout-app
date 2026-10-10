// src/components/billing-buttons.tsx
"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

async function go(url: string, body?: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.url) throw new Error(json.error ?? "Something went wrong");
  window.location.href = json.url;
}

export function SubscribeButton({ plan, label }: { plan: "starter" | "pro"; label: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <Button disabled={busy} onClick={async () => {
      setBusy(true);
      try { await go("/api/stripe/checkout", { plan }); }
      catch (e) { toast.error((e as Error).message); setBusy(false); }
    }}>
      {busy ? "Redirecting…" : label}
    </Button>
  );
}

export function ManageButton() {
  const [busy, setBusy] = useState(false);
  return (
    <Button variant="outline" disabled={busy} onClick={async () => {
      setBusy(true);
      try { await go("/api/stripe/portal"); }
      catch (e) { toast.error((e as Error).message); setBusy(false); }
    }}>
      {busy ? "Redirecting…" : "Manage billing"}
    </Button>
  );
}
