// src/components/project-form.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "@/components/tag-input";

const labelCls = "mb-1.5 block text-sm font-medium";
const hintCls = "mt-1 text-xs text-muted-foreground";

export type ProjectValues = {
  id: string;
  name: string;
  product_description: string;
  brand_name: string | null;
  keywords: string[];
  subreddits: string[];
  exclude_keywords: string[];
  min_score: number;
  is_active: boolean;
};

// بدون project = إنشاء، ومعه = تعديل
export function ProjectForm({ project }: { project?: ProjectValues }) {
  const router = useRouter();
  const editing = Boolean(project);
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.product_description ?? "");
  const [brand, setBrand] = useState(project?.brand_name ?? "");
  const [keywords, setKeywords] = useState<string[]>(project?.keywords ?? []);
  const [subreddits, setSubreddits] = useState<string[]>(project?.subreddits ?? []);
  const [excluded, setExcluded] = useState<string[]>(project?.exclude_keywords ?? []);
  const [minScore, setMinScore] = useState(project?.min_score ?? 60);
  const [isActive, setIsActive] = useState(project?.is_active ?? true);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(editing ? `/api/projects/${project!.id}` : "/api/projects", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        product_description: description,
        brand_name: brand || null,
        keywords,
        subreddits,
        exclude_keywords: excluded,
        min_score: minScore,
        ...(editing ? { is_active: isActive } : {}),
      }),
    });
    const json = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) return toast.error(json.error ?? "Could not save the project");
    toast.success(editing ? "Changes saved" : "Project saved");
    router.push(`/dashboard?p=${json.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-2xl flex-col gap-6">
      <div>
        <label htmlFor="name" className={labelCls}>Project name</label>
        <Input id="name" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)}
               placeholder="e.g. Invoicing app for freelancers" />
      </div>

      <div>
        <label htmlFor="desc" className={labelCls}>What do you sell, and who is it for?</label>
        <Textarea id="desc" required minLength={20} maxLength={1500} rows={5} value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the problem it solves, who uses it, and what makes it different. The AI uses this to judge which posts fit and to write replies." />
        <p className={hintCls}>{description.length}/1500</p>
      </div>

      <div>
        <label htmlFor="brand" className={labelCls}>Brand name (optional)</label>
        <Input id="brand" maxLength={60} value={brand} onChange={(e) => setBrand(e.target.value)} />
        <p className={hintCls}>
          When a reply mentions your product, it says you're affiliated. Reddit communities remove undisclosed promotion.
        </p>
      </div>

      <div>
        <label htmlFor="keywords" className={labelCls}>Keywords</label>
        <TagInput id="keywords" value={keywords} onChange={setKeywords} max={15}
                  placeholder="e.g. invoice software, late payments, alternative to FreshBooks" />
      </div>

      <div>
        <label htmlFor="subs" className={labelCls}>Subreddits to watch</label>
        <TagInput id="subs" value={subreddits} onChange={setSubreddits} max={10} prefix="r/"
                  placeholder="e.g. freelance, smallbusiness" />
      </div>

      <div>
        <label htmlFor="excluded" className={labelCls}>Words to exclude (optional)</label>
        <TagInput id="excluded" value={excluded} onChange={setExcluded} max={15}
                  placeholder="e.g. hiring, job, free template" />
        <p className={hintCls}>
          Posts containing any of these words are skipped before the AI sees them. This cuts noise and cost.
        </p>
      </div>

      <div>
        <label htmlFor="score" className={labelCls}>Minimum relevance: {minScore}%</label>
        <input id="score" type="range" min={30} max={95} step={5} value={minScore}
               onChange={(e) => setMinScore(Number(e.target.value))} className="w-full" />
        <p className={hintCls}>
          Higher means fewer, better leads. Start at 60 and adjust once you see what comes in. A change applies to new posts only, because posts already checked are not scored again.
        </p>
      </div>

      {editing && (
        <div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Scan this project automatically
          </label>
          <p className={hintCls}>Turn this off to pause scans. Your leads stay in the inbox.</p>
        </div>
      )}

      <div>
        <Button type="submit" disabled={saving || !keywords.length || !subreddits.length}>
          {saving ? "Saving…" : editing ? "Save changes" : "Save project"}
        </Button>
      </div>
    </form>
  );
}
