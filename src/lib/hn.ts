// src/lib/hn.ts
// مصدر بيانات مؤقت للاختبار: Hacker News عبر Algolia (مجاني، بلا مفتاح).
// يُستخدم فقط عندما لا تتوفر مفاتيح Reddit، ليمكن اختبار جودة التقييم والمسودات.
import type { RedditItem } from "./reddit";

type Hit = {
  objectID: string;
  title?: string | null;
  story_title?: string | null;
  story_text?: string | null;
  comment_text?: string | null;
  author?: string | null;
  created_at_i: number;
  _tags?: string[];
};

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x2F;/g, "/")
    .replace(/\s+/g, " ")
    .trim();
}

async function search(query: string, tags: "story" | "comment", sinceSec: number): Promise<Hit[]> {
  const qs = new URLSearchParams({
    query,
    tags,
    numericFilters: `created_at_i>${sinceSec}`,
    hitsPerPage: "40",
  });
  const res = await fetch(`https://hn.algolia.com/api/v1/search_by_date?${qs}`);
  if (!res.ok) throw new Error(`HN search failed: ${res.status}`);
  const data = (await res.json()) as { hits: Hit[] };
  return data.hits ?? [];
}

/** منشورات وتعليقات HN حديثة (آخر 24 ساعة) تطابق كل كلمة مفتاحية. */
export async function fetchHackerNews(keywords: string[]): Promise<RedditItem[]> {
  const since = Math.floor(Date.now() / 1000) - 86_400;
  const out = new Map<string, RedditItem>();

  for (const kw of keywords.slice(0, 8)) {
    for (const tag of ["story", "comment"] as const) {
      let hits: Hit[] = [];
      try {
        hits = await search(kw, tag, since);
      } catch (e) {
        console.error(`[hn] "${kw}" ${tag}:`, (e as Error).message);
        continue;
      }
      for (const h of hits) {
        const isStory = tag === "story";
        const body = stripHtml((isStory ? h.story_text : h.comment_text) ?? "");
        const title = (isStory ? h.title : h.story_title) ?? null;
        if (!title && !body) continue;
        const id = `hn_${h.objectID}`;
        out.set(id, {
          redditId: id,
          kind: isStory ? "post" : "comment",
          subreddit: "hackernews",
          author: h.author ?? null,
          title,
          body,
          permalink: `https://news.ycombinator.com/item?id=${h.objectID}`,
          createdAt: new Date(h.created_at_i * 1000),
          flags: { stickied: false, over18: false, locked: false, archived: false },
        });
      }
    }
  }
  return [...out.values()];
}
