// src/lib/filters.ts
// فلترة مجانية قبل الوصول إلى OpenAI: كل عنصر يُستبعد هنا يوفّر تكلفة ويحسّن الدقة.
import type { RedditItem } from "./reddit";

export type SkipReason =
  | "removed" | "bot" | "flagged" | "short"
  | "no_keyword" | "excluded" | "not_asking" | "duplicate";

const BOT_AUTHOR = /(^|[_-])bot$|^automoderator$/i;

// التعليقات التي تجيب الآخرين نادرًا ما تكون فرصًا؛ نبقي فقط ما يبدو سؤالًا أو حاجة
const ASK_HINT =
  /\?|looking for|recommend|suggest|alternative|any (tool|app|software|service)|which (tool|app|software)|how (do|can|should|to)|struggl|need (a|an|some|help)|wish (there|i)|frustrat|can anyone|does anyone|anyone (know|use|tried)/i;

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// تطابق بداية الكلمة، فتلتقط "invoice" داخل "invoices"، وتدعم الحروف غير اللاتينية
function phraseRegex(list: string[]): RegExp | null {
  const parts = list
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => escapeRe(s).replace(/\s+/g, "\\s+"));
  if (!parts.length) return null;
  return new RegExp(`(?<![\\p{L}\\p{N}])(?:${parts.join("|")})`, "iu");
}

export function prefilter(
  items: RedditItem[],
  cfg: { keywords: string[]; exclude_keywords: string[] }
) {
  const kw = phraseRegex(cfg.keywords);
  const ex = phraseRegex(cfg.exclude_keywords);
  const seenText = new Set<string>();
  const kept: RedditItem[] = [];
  const skipped: Partial<Record<SkipReason, number>> = {};
  const skip = (r: SkipReason) => { skipped[r] = (skipped[r] ?? 0) + 1; };

  for (const it of items) {
    const body = it.body.trim();
    const text = `${it.title ?? ""}\n${body}`.trim();

    if (body === "[deleted]" || body === "[removed]" || (it.kind === "comment" && !body)) { skip("removed"); continue; }
    if (!it.author || it.author === "[deleted]" || BOT_AUTHOR.test(it.author)) { skip("bot"); continue; }
    if (it.flags.stickied || it.flags.over18 || it.flags.locked || it.flags.archived) { skip("flagged"); continue; }
    if (text.length < (it.kind === "post" ? 25 : 40)) { skip("short"); continue; }

    // التعليقات تُجلب بلا بحث، فنتحقق محليًا من الكلمات المفتاحية في نص التعليق نفسه
    if (it.kind === "comment" && kw && !kw.test(body)) { skip("no_keyword"); continue; }
    if (ex && ex.test(text)) { skip("excluded"); continue; }
    if (it.kind === "comment" && !ASK_HINT.test(body)) { skip("not_asking"); continue; }

    const key = text.toLowerCase().replace(/\s+/g, " ").slice(0, 300);
    if (seenText.has(key)) { skip("duplicate"); continue; }
    seenText.add(key);

    kept.push(it);
  }
  return { kept, skipped };
}
