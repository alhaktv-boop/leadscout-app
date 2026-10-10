// src/lib/scan.ts
// خط الأنابيب: Reddit → استبعاد المعروف → فلترة مجانية → تقييم دفعات → مسودات للناجحين فقط → حفظ
import { createAdminClient } from "./supabase/admin";
import { fetchPosts, fetchRecentComments, type RedditItem } from "./reddit";
import { prefilter } from "./filters";
import { draftReply, scoreBatch, type ScoreResult } from "./ai";

const SCORE_BATCH_SIZE = 8;
const SCORE_CONCURRENCY = 3;
const DRAFT_CONCURRENCY = 5;
const MAX_ITEMS_PER_SCAN = 150; // سقف لتكلفة OpenAI في الفحص الواحد
const SEEN_RETENTION_DAYS = 14; // نافذة البحث يوم واحد، فلا حاجة لذاكرة أطول
const ID_CHUNK = 150; // يتجنب تجاوز طول الرابط في استعلامات .in()

type Admin = ReturnType<typeof createAdminClient>;

async function inBatches<T, R>(items: T[], size: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(...(await Promise.all(items.slice(i, i + size).map(fn))));
  }
  return out;
}

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

// ما حُلّل سابقًا (ناجحًا أو لا) أو حُفظ فرصةً
async function findSeen(admin: Admin, projectId: string, ids: string[]) {
  const seen = new Set<string>();
  for (const part of chunk(ids, ID_CHUNK)) {
    for (const table of ["scanned_items", "leads"] as const) {
      const { data, error } = await admin
        .from(table).select("reddit_id").eq("project_id", projectId).in("reddit_id", part);
      if (error) throw error;
      data?.forEach((r) => seen.add(r.reddit_id as string));
    }
  }
  return seen;
}

export async function scanProject(projectId: string) {
  const admin = createAdminClient();
  const { data: project, error } = await admin
    .from("projects").select("*").eq("id", projectId).single();
  if (error || !project) throw new Error("Project not found");

  const { data: run } = await admin
    .from("scan_runs").insert({ project_id: projectId }).select("id").single();

  const stats = { fetched: 0, skipped: 0, scored: 0, created: 0, promptTokens: 0, completionTokens: 0 };
  let runError: string | null = null;

  try {
    // 1) الجلب من كل subreddit
    const byId = new Map<string, RedditItem>();
    for (const sub of project.subreddits as string[]) {
      try {
        const posts = await fetchPosts(sub, project.keywords as string[]);
        const comments = await fetchRecentComments(sub);
        for (const it of [...posts, ...comments]) byId.set(it.redditId, it);
      } catch (e) {
        console.error(`[scan] r/${sub}:`, (e as Error).message); // نكمل بباقي المجتمعات
      }
    }
    const all = [...byId.values()];
    stats.fetched = all.length;

    // 2) استبعاد ما رأيناه سابقًا
    const seen = await findSeen(admin, projectId, all.map((i) => i.redditId));
    const fresh = all.filter((i) => !seen.has(i.redditId));

    // 3) فلترة مجانية قبل الذكاء الاصطناعي
    const { kept } = prefilter(fresh, {
      keywords: project.keywords as string[],
      exclude_keywords: (project.exclude_keywords as string[] | null) ?? [],
    });
    stats.skipped = fresh.length - kept.length;

    // 4) السقف: المنشورات أولًا ثم الأحدث
    const candidates = kept
      .sort((a, b) =>
        a.kind === b.kind ? b.createdAt.getTime() - a.createdAt.getTime() : a.kind === "post" ? -1 : 1
      )
      .slice(0, MAX_ITEMS_PER_SCAN);

    // 5) تقييم بالدفعات
    const scores = new Map<string, ScoreResult>();
    await inBatches(chunk(candidates, SCORE_BATCH_SIZE), SCORE_CONCURRENCY, async (batch) => {
      try {
        const { results, usage } = await scoreBatch(batch, project);
        stats.promptTokens += usage.prompt;
        stats.completionTokens += usage.completion;
        batch.forEach((item, i) => {
          const r = results.get(i);
          if (r) scores.set(item.redditId, r);
        });
      } catch (e) {
        console.error("[ai score]", (e as Error).message); // لا نعلّم العناصر كمرئية، فتُعاد المحاولة لاحقًا
      }
    });
    stats.scored = scores.size;

    const scored = candidates.filter((i) => scores.has(i.redditId));
    const passing = scored.filter((i) => scores.get(i.redditId)!.score >= project.min_score);

    // 6) مسودات للناجحين فقط
    const drafts = new Map<string, string | null>();
    await inBatches(passing, DRAFT_CONCURRENCY, async (item) => {
      const s = scores.get(item.redditId)!;
      try {
        const { draft, usage } = await draftReply(item, project, s);
        stats.promptTokens += usage.prompt;
        stats.completionTokens += usage.completion;
        drafts.set(item.redditId, draft);
      } catch (e) {
        console.error("[ai draft]", (e as Error).message);
        drafts.set(item.redditId, null); // نحفظ الفرصة بلا مسودة بدل خسارتها
      }
    });

    // 7) حفظ الفرص
    const rows = passing.map((item) => {
      const s = scores.get(item.redditId)!;
      return {
        project_id: projectId,
        reddit_id: item.redditId,
        kind: item.kind,
        subreddit: item.subreddit,
        author: item.author,
        title: item.title,
        body: item.body,
        permalink: item.permalink,
        reddit_created_at: item.createdAt.toISOString(),
        score: s.score,
        intent: s.intent,
        reason: s.reason,
        draft_reply: drafts.get(item.redditId) ?? null,
      };
    });

    let leadsSaved = true;
    if (rows.length) {
      const { error: insErr } = await admin
        .from("leads").upsert(rows, { onConflict: "project_id,reddit_id", ignoreDuplicates: true });
      if (insErr) { leadsSaved = false; runError = insErr.message; }
      else stats.created = rows.length;
    }

    // 8) تعليم العناصر كمرئية (لا نعلّم الناجحين إن فشل حفظهم، لتُعاد المحاولة)
    const passIds = new Set(passing.map((i) => i.redditId));
    const toMark = scored
      .filter((i) => leadsSaved || !passIds.has(i.redditId))
      .map((i) => ({ project_id: projectId, reddit_id: i.redditId, score: scores.get(i.redditId)!.score }));
    if (toMark.length) {
      await admin.from("scanned_items")
        .upsert(toMark, { onConflict: "project_id,reddit_id", ignoreDuplicates: true });
    }

    // 9) تنظيف الذاكرة القديمة
    const cutoff = new Date(Date.now() - SEEN_RETENTION_DAYS * 86_400_000).toISOString();
    await admin.from("scanned_items").delete().eq("project_id", projectId).lt("seen_at", cutoff);
  } catch (e) {
    runError = (e as Error).message;
  }

  if (run?.id) {
    await admin.from("scan_runs").update({
      fetched_count: stats.fetched,
      scored_count: stats.scored,
      leads_created: stats.created,
      skipped_count: stats.skipped,
      prompt_tokens: stats.promptTokens,
      completion_tokens: stats.completionTokens,
      error: runError,
    }).eq("id", run.id);
  }

  return { ...stats, error: runError };
}
