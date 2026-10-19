// src/lib/bsky.ts
// مصدر Bluesky العام (مجاني، بلا مفتاح): بحث نصي في المنشورات العامة الحديثة.
import type { RedditItem } from "./reddit";

type Post = {
  uri: string;
  author?: { handle?: string };
  record?: { text?: string; createdAt?: string };
  indexedAt?: string;
};

async function search(query: string, sinceIso: string): Promise<Post[]> {
  const qs = new URLSearchParams({ q: query, limit: "40", sort: "latest", since: sinceIso });
  const res = await fetch(`https://api.bsky.app/xrpc/app.bsky.feed.searchPosts?${qs}`, {
    headers: { "User-Agent": "leadscout/0.1" },
  });
  if (!res.ok) throw new Error(`Bluesky search failed: ${res.status}`);
  const data = (await res.json()) as { posts?: Post[] };
  return data.posts ?? [];
}

/** منشورات Bluesky العامة خلال آخر 24 ساعة تطابق كل كلمة مفتاحية. */
export async function fetchBluesky(keywords: string[]): Promise<RedditItem[]> {
  const sinceIso = new Date(Date.now() - 86_400_000).toISOString();
  const out = new Map<string, RedditItem>();

  for (const kw of keywords.slice(0, 8)) {
    let posts: Post[] = [];
    try {
      posts = await search(kw, sinceIso);
    } catch (e) {
      console.error(`[bsky] "${kw}":`, (e as Error).message);
      continue;
    }
    for (const p of posts) {
      const text = (p.record?.text ?? "").trim();
      const handle = p.author?.handle;
      const rkey = p.uri?.split("/").pop();
      if (!text || !handle || !rkey) continue;
      const id = `bsky_${handle}_${rkey}`;
      out.set(id, {
        redditId: id,
        kind: "post",
        subreddit: "bluesky",
        author: handle,
        title: null,
        body: text,
        permalink: `https://bsky.app/profile/${handle}/post/${rkey}`,
        createdAt: new Date(p.record?.createdAt ?? p.indexedAt ?? Date.now()),
        flags: { stickied: false, over18: false, locked: false, archived: false },
      });
    }
  }
  return [...out.values()];
}
