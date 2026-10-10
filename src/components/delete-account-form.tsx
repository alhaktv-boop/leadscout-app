// src/components/delete-account-form.tsx
"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DeleteAccountForm({ email }: { email: string }) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const matches = email !== "" && value.trim().toLowerCase() === email.toLowerCase();

  async function remove() {
    setBusy(true);
    const res = await fetch("/api/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: value }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setBusy(false);
      return toast.error(json.error ?? "Could not delete the account");
    }
    window.location.href = "/"; // تنقّل كامل ليمسح حالة الجلسة في المتصفح
  }

  return (
    <div className="flex max-w-md flex-col gap-3">
      <div>
        <label htmlFor="confirm-email" className="mb-1.5 block text-sm font-medium">
          Type your email address to confirm
        </label>
        <Input id="confirm-email" value={value} onChange={(e) => setValue(e.target.value)}
               placeholder={email} autoComplete="off" />
      </div>
      <div>
        <Button variant="destructive" disabled={!matches || busy} onClick={remove}>
          {busy ? "Deleting…" : "Delete my account"}
        </Button>
      </div>
    </div>
  );
}
