// src/components/scan-button.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ScanButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function scan() {
    setBusy(true);
    const res = await fetch(`/api/projects/${projectId}/scan`, { method: "POST" });
    const json = await res.json().catch(() => ({}));
    setBusy(false);

    if (!res.ok) return toast.error(json.error ?? "Scan failed");
    if (json.error) toast.error(`Scan finished with an error: ${json.error}`);
    else toast.success(`Checked ${json.scored} new items, found ${json.created} leads`);
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" onClick={scan} disabled={busy}>
      {busy ? "Scanning…" : "Scan now"}
    </Button>
  );
}
