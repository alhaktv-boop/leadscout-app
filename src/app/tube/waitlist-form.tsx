"use client";
import { useState } from "react";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("");
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, topic, website }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p className="rounded-xl bg-emerald-50 p-5 text-lg font-semibold text-emerald-800">
        تم تسجيلك ✅ سنراسلك عندما تكون الأداة جاهزة، وستحصل على أول شهر مجانًا.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <input
        type="email"
        required
        dir="ltr"
        placeholder="بريدك الإلكتروني"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg text-slate-900"
      />
      <input
        type="text"
        placeholder="موضوع قناتك (اختياري)، مثل: طبخ، ألعاب، تقنية"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg text-slate-900"
      />
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className="hidden"
        aria-hidden="true"
      />
      <button
        type="submit"
        disabled={state === "loading"}
        className="rounded-xl bg-red-600 px-6 py-3 text-lg font-bold text-white disabled:opacity-60"
      >
        {state === "loading" ? "جارٍ التسجيل…" : "سجّل اهتمامك مجانًا"}
      </button>
      {state === "error" && (
        <p className="text-red-700">حدث خطأ، جرّب مرة أخرى بعد قليل.</p>
      )}
    </form>
  );
}
