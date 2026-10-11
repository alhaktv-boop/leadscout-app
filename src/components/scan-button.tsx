// src/components/scan-button.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ScanButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  // النتيجة تبقى ظاهرة تحت الزر ولا تختفي مثل الإشعار
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  async function scan() {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/scan`, { method: "POST" });
      const raw = await res.text();
      let json: { error?: string; scored?: number; created?: number; fetched?: number } = {};
      try {
        json = JSON.parse(raw);
      } catch {
        // الخادم أعاد نصًا ليس JSON (غالبًا خطأ في الخادم أو انتهاء المهلة)
      }

      if (!res.ok) {
        const text = `HTTP ${res.status}: ${json.error ?? (raw.slice(0, 200) || "Scan failed")}`;
        setResult({ ok: false, text });
        return toast.error(text);
      }
      if (json.error) {
        const text = `Scan finished with an error: ${json.error}`;
        setResult({ ok: false, text });
        toast.error(text);
      } else {
        const text = `Fetched ${json.fetched ?? 0}, checked ${json.scored ?? 0} new items, found ${json.created ?? 0} leads`;
        setResult({ ok: true, text });
        toast.success(text);
      }
      router.refresh();
    } catch (e) {
      const text = `Network error: ${(e as Error).message}`;
      setResult({ ok: false, text });
      toast.error(text);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="outline" size="sm" onClick={scan} disabled={busy}>
        {busy ? "Scanning…" : "Scan now"}
      </Button>
      {result && (
        <p
          role="status"
          className={`max-w-xs text-right text-xs ${result.ok ? "text-emerald-700" : "text-red-600"}`}
        >
          {result.text}
        </p>
      )}
    </div>
  );
}
