// src/components/delete-project-button.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function DeleteProjectButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!confirm("Delete this project and all its leads? This can't be undone.")) return;
    setBusy(true);
    const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
    if (!res.ok) {
      setBusy(false);
      return toast.error("Could not delete the project");
    }
    toast.success("Project deleted");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Button variant="ghost" className="text-red-600 hover:text-red-700" disabled={busy} onClick={remove}>
      {busy ? "Deleting…" : "Delete project"}
    </Button>
  );
}
