"""Probe free/open sources for buying-intent posts (web designers/developers niche). Writes scripts/probe_result.md"""
import json, re, time, urllib.parse, urllib.request, urllib.error, datetime, html

UA = {"User-Agent": "leadscout-probe/0.1 (research; contact lazharello@gmail.com)"}
QUERIES = ["looking for a web designer", "need a website for my business", "recommend a web developer",
           "looking for a freelance developer", "need someone to build a website", "website redesign quote"]
out = ["# Source probe\n"]

def get(url):
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=25) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, None
    except Exception as e:
        return type(e).__name__, None

def clean(s, n=170):
    s = html.unescape(re.sub(r"<[^>]+>", " ", s or "")); return re.sub(r"\s+", " ", s).strip()[:n]

def section(name, rows, status):
    out.append(f"\n## {name} (HTTP {status}) - {len(rows)} items\n")
    for t, snip, url, age in rows[:6]:
        out.append(f"- [{clean(t,90)}]({url}) ({age}) :: {clean(snip)}")

def ago(ts):
    d = (time.time() - ts) / 86400; return f"{d:.0f}d"

week = int(time.time()) - 14 * 86400
# 1 Hacker News
rows, st = [], 200
for q in QUERIES:
    for tag in ("story", "comment"):
        s, j = get("https://hn.algolia.com/api/v1/search_by_date?" + urllib.parse.urlencode({"query": q, "tags": tag, "numericFilters": f"created_at_i>{week}", "hitsPerPage": 10}))
        st = s
        for h in (j or {}).get("hits", []):
            rows.append((h.get("title") or h.get("story_title") or "(comment)", h.get("story_text") or h.get("comment_text") or "", f"https://news.ycombinator.com/item?id={h['objectID']}", ago(h["created_at_i"])))
section("Hacker News", rows, st)
# 2 Stack Exchange
for site in ("webmasters", "wordpress", "graphicdesign", "ux"):
    rows, st = [], 200
    for q in QUERIES[:3]:
        s, j = get("https://api.stackexchange.com/2.3/search/advanced?" + urllib.parse.urlencode({"q": q, "site": site, "fromdate": week - 14 * 86400, "order": "desc", "sort": "creation", "pagesize": 10, "filter": "withbody"}))
        st = s
        for it in (j or {}).get("items", []):
            rows.append((it["title"], it.get("body", ""), it["link"], ago(it["creation_date"])))
    section(f"Stack Exchange / {site}", rows, st)
# 3 Bluesky
for host in ("https://public.api.bsky.app", "https://api.bsky.app"):
    rows, st = [], 200
    for q in QUERIES[:4]:
        s, j = get(f"{host}/xrpc/app.bsky.feed.searchPosts?" + urllib.parse.urlencode({"q": q, "limit": 25, "sort": "latest"}))
        st = s
        for p in (j or {}).get("posts", []):
            ts = datetime.datetime.fromisoformat(p["indexedAt"].replace("Z", "+00:00")).timestamp()
            rows.append((p["author"].get("handle", ""), p["record"].get("text", ""), "https://bsky.app/profile/%s/post/%s" % (p["author"]["handle"], p["uri"].split("/")[-1]), ago(ts)))
    section(f"Bluesky via {host}", rows, st)
# 4 Mastodon (search needs login; hashtag timelines are public)
rows, st = [], 200
for tag in ("needawebdesigner", "webdesigner", "hireafreelancer", "freelancedeveloper", "needadeveloper"):
    s, j = get(f"https://mastodon.social/api/v1/timelines/tag/{tag}?limit=20"); st = s
    for p in (j or []):
        ts = datetime.datetime.fromisoformat(p["created_at"].replace("Z", "+00:00")).timestamp()
        rows.append((f"#{tag}", p.get("content", ""), p["url"], ago(ts)))
section("Mastodon hashtags", rows, st)
s, j = get("https://mastodon.social/api/v2/search?" + urllib.parse.urlencode({"q": QUERIES[0], "type": "statuses"}))
out.append(f"\n(Mastodon full-text search without login: HTTP {s})")
# 5 Lemmy
for inst in ("lemmy.world", "lemmy.ml"):
    rows, st = [], 200
    for q in QUERIES[:4]:
        s, j = get(f"https://{inst}/api/v3/search?" + urllib.parse.urlencode({"q": q, "type_": "Posts", "sort": "New", "limit": 20}))
        st = s
        for p in (j or {}).get("posts", []):
            po = p["post"]; ts = datetime.datetime.fromisoformat(po["published"].replace("Z", "+00:00")).timestamp()
            rows.append((po["name"], po.get("body", ""), po["ap_id"], ago(ts)))
    section(f"Lemmy {inst}", rows, st)
# 6 Dev.to
rows, st = [], 200
for tag in ("freelance", "webdev"):
    s, j = get(f"https://dev.to/api/articles?tag={tag}&per_page=15&top=7"); st = s
    for a in (j or []): rows.append((a["title"], a.get("description", ""), a["url"], "<=7d"))
section("Dev.to", rows, st)
open("scripts/probe_result.md", "w").write("\n".join(out) + "\n"); print("\n".join(out)[:3000])
