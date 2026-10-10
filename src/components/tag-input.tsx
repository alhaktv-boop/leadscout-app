// src/components/tag-input.tsx
"use client";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

type Props = {
  id: string;
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  max?: number;
  prefix?: string; // مثل "r/" للـ subreddits
};

export function TagInput({ id, value, onChange, placeholder, max = 15, prefix = "" }: Props) {
  const [draft, setDraft] = useState("");

  function commit(raw: string) {
    const items = raw.split(",").map((s) => s.trim().replace(/^\/?r\//i, "")).filter(Boolean);
    const next = [...value];
    for (const it of items) {
      if (next.length >= max) break;
      if (!next.some((x) => x.toLowerCase() === it.toLowerCase())) next.push(it);
    }
    onChange(next);
    setDraft("");
  }

  return (
    <div className="rounded-md border px-2 py-2 focus-within:ring-2 focus-within:ring-ring">
      <div className="flex flex-wrap gap-1.5">
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1">
            {prefix}{tag}
            <button type="button" aria-label={`Remove ${tag}`}
                    onClick={() => onChange(value.filter((t) => t !== tag))}
                    className="ml-0.5 text-muted-foreground hover:text-foreground">×</button>
          </Badge>
        ))}
        <input
          id={id}
          value={draft}
          placeholder={value.length ? "" : placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") { e.preventDefault(); if (draft.trim()) commit(draft); }
            else if (e.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1));
          }}
          onBlur={() => draft.trim() && commit(draft)}
          className="min-w-[8rem] flex-1 bg-transparent px-1 py-0.5 text-sm outline-none"
        />
      </div>
      <p className="mt-1.5 px-1 text-xs text-muted-foreground">
        Press Enter or comma to add · {value.length}/{max}
      </p>
    </div>
  );
}
