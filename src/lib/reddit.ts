// src/lib/reddit.ts
// عميل Reddit خفيف عبر OAuth (app-only) باستخدام fetch فقط.

const USER_AGENT =
  process.env.REDDIT_USER_AGENT ?? "web:leadscout:0.1 (by /u/YOUR_REDDIT_USERNAME)";

export type RedditItem = {
  redditId: string; // fullname: t3_xxx (post) أو t1_xxx (comment)
  kind: "post" | "comment";
  subreddit: string;
  author: string | null;
  title: string | null; // للتعليق: عنوان المنشور الأصلي
  body: string;
  permalink: string;
  createdAt: Date;
  flags: { stickied: boolean; over18: boolean; locked: boolean; archived: boolean };
};

type RawData = {
  name: string;
  subreddit: string;
  author?: string | null;
  title?: string;
  selftext?: string;
  body?: string;
  link_title?: string;
  permalink: string;
  created_utc: number;
  stickied?: boolean;
  over_18?: boolean;
  link_over_18?: boolean;
  locked?: boolean;
  archived?: boolean;
};
type Listing = { data: { children: { data: RawData }[] } };

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) return cachedToken.value;

  const basic = Buffer.from(
    `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": USER_AGENT,
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`Reddit auth failed: ${res.status}`);

  const data = await res.json();
  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.value;
}

async function redditGet(path: string, params: Record<string, string | number> = {}): Promise<Listing> {
  const token = await getAccessToken();
  const qs = new URLSearchParams({
    raw_json: "1",
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
  });

  const res = await fetch(`https://oauth.reddit.com${path}?${qs}`, {
    headers: { Authorization: `Bearer ${token}`, "User-Agent": USER_AGENT },
  });

  if (res.status === 429) {
    const wait = Number(res.headers.get("retry-after") ?? 5);
    throw new Error(`Reddit rate limited, retry after ${wait}s`);
  }
  if (!res.ok) throw new Error(`Reddit API ${path} failed: ${res.status}`);
  return (await res.json()) as Listing;
}

function toItem(d: RawData, kind: "post" | "comment"): RedditItem {
  return {
    redditId: d.name,
    kind,
    subreddit: d.subreddit,
    author: d.author ?? null,
    title: (kind === "post" ? d.title : d.link_title) ?? null,
    body: (kind === "post" ? d.selftext : d.body) ?? "",
    permalink: `https://www.reddit.com${d.permalink}`,
    createdAt: new Date(d.created_utc * 1000),
    flags: {
      stickied: !!d.stickied,
      over18: !!(d.over_18 ?? d.link_over_18),
      locked: !!d.locked,
      archived: !!d.archived,
    },
  };
}

/** منشورات جديدة في subreddit تطابق كلمة مفتاحية على الأقل (آخر 24 ساعة). */
export async function fetchPosts(subreddit: string, keywords: string[], limit = 50): Promise<RedditItem[]> {
  const q = keywords.map((k) => `"${k.replace(/"/g, "")}"`).join(" OR ");
  const data = await redditGet(`/r/${subreddit}/search`, {
    q, restrict_sr: 1, sort: "new", t: "day", limit, include_over_18: "off",
  });
  return data.data.children.map((c) => toItem(c.data, "post"));
}

/** أحدث التعليقات في subreddit بلا تصفية. الفلترة بالكلمات المفتاحية تتم في filters.ts
 *  (Reddit لا يوفر بحثًا في التعليقات عبر API الرسمي). */
export async function fetchRecentComments(subreddit: string, limit = 100): Promise<RedditItem[]> {
  const data = await redditGet(`/r/${subreddit}/comments`, { limit });
  return data.data.children.map((c) => toItem(c.data, "comment"));
}
