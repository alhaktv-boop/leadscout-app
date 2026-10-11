// src/lib/ai.ts
// مرحلتان لتقليل التكلفة:
//   1) scoreBatch: تقييم دفعة من العناصر في طلب واحد (مخرجات قصيرة جدًا)
//   2) draftReply: كتابة مسودة فقط للعناصر التي تجاوزت الحد الأدنى
import OpenAI from "openai";
import { z } from "zod";
import type { RedditItem } from "./reddit";

let client: OpenAI | null = null;
function getOpenAI() {
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

const MODEL = "gpt-4o-mini";
const SCORE_TEXT_CHARS = 700; // النية تظهر غالبًا في بداية النص
const DRAFT_TEXT_CHARS = 2000;

const INTENTS = ["buying_intent", "asking_recommendation", "complaint", "other"] as const;
export type Intent = (typeof INTENTS)[number];
export type ScoreResult = { score: number; intent: Intent; reason: string };
export type Usage = { prompt: number; completion: number };
type ProjectCtx = { product_description: string; brand_name: string | null };

const Row = z.object({
  id: z.number().int(),
  score: z.number().transform((n) => Math.max(0, Math.min(100, Math.round(n)))),
  intent: z.enum(INTENTS).catch("other"),
  reason: z.string().transform((s) => s.slice(0, 240)),
});
const Parsed = z.object({ results: z.array(Row) });

const SCORE_PROMPT = `You qualify Reddit posts and comments as sales leads for ONE product.

Score each item from 0 to 100: how likely its author would genuinely benefit from the product, judged from the text alone.
- 85-100: explicitly asks for a tool, service or recommendation the product fits, or says they are about to buy or switch
- 65-84: describes a concrete, current problem the product solves and seems open to solutions
- 40-64: loosely related, vague need, or no clear ask
- 0-39: articles, guides, tutorials, announcements, "Show HN" or launch posts where the author is explaining or promoting something rather than asking; unrelated; venting with no ask; already solved or already chose a solution; giving advice rather than seeking it; jobs or hiring; memes or news; the author is promoting their own product or a competitor; asks for something the product cannot do

Rules:
- Judge the author's need, not whether the text merely contains a keyword.
- The author must be the one who has the problem or is looking for a solution. If the author is teaching, informing or selling, score below 40.
- Use asking_recommendation only when the author explicitly asks a question or requests suggestions.
- Be conservative: when unsure, score below 60.
- reason: one short sentence (max 20 words) quoting or naming the evidence in the text.
- intent: buying_intent, asking_recommendation, complaint or other.

Return JSON {"results":[{"id":int,"score":int,"intent":"...","reason":"..."}]} with exactly one entry per input id.`;

const DRAFT_PROMPT = `You draft a Reddit reply for a person who wants to help, and who may mention their own product.

Rules:
- Sound like a thoughtful community member, not a marketer. 2-5 sentences, plain text, no emojis, no hashtags, no markdown headings.
- Start with something useful for the author's actual problem: a concrete tip, a step, or a question that moves them forward.
- Mention the product at most once, only if it genuinely fits, in a low-key way. If it does not fit, do not mention it.
- If a brand name is given and you mention the product, say plainly that you work on it or built it (for example "I work on X"). If no brand name is given, do not mention the product by name.
- Never invent personal experiences, customer stories, credentials, statistics, features or links.
- Do not claim to be a customer of the product. No pressure, no urgency.
- Reply in the language of the original text.
- Never compliment or restate what the author wrote. Do not assume the author is "exploring" or "planning" anything they did not say.
- If the author is not asking for help or advice (for example an article or announcement), output exactly: SKIP
- Output only the reply text. If no genuinely helpful reply is possible, output exactly: SKIP`;

const label = (it: RedditItem) => (it.kind === "comment" ? "Thread" : "Title");

export async function scoreBatch(items: RedditItem[], project: ProjectCtx) {
  const list = items
    .map((it, i) =>
      [
        `[id ${i}] r/${it.subreddit} (${it.kind})`,
        it.title ? `${label(it)}: ${it.title.slice(0, 200)}` : "",
        `Text: ${it.body.slice(0, SCORE_TEXT_CHARS)}`,
      ].filter(Boolean).join("\n")
    )
    .join("\n\n");

  const completion = await getOpenAI().chat.completions.create({
    model: MODEL,
    temperature: 0,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "lead_scores",
        strict: true,
        schema: {
          type: "object",
          properties: {
            results: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "integer" },
                  score: { type: "integer" },
                  intent: { type: "string", enum: [...INTENTS] },
                  reason: { type: "string" },
                },
                required: ["id", "score", "intent", "reason"],
                additionalProperties: false,
              },
            },
          },
          required: ["results"],
          additionalProperties: false,
        },
      },
    },
    messages: [
      { role: "system", content: SCORE_PROMPT },
      { role: "user", content: `PRODUCT: ${project.product_description}\n\nITEMS:\n${list}` },
    ],
  });

  const parsed = Parsed.parse(JSON.parse(completion.choices[0]?.message?.content ?? "{}"));
  const results = new Map<number, ScoreResult>();
  for (const r of parsed.results) {
    if (r.id >= 0 && r.id < items.length && !results.has(r.id)) {
      results.set(r.id, { score: r.score, intent: r.intent, reason: r.reason });
    }
  }
  const usage: Usage = {
    prompt: completion.usage?.prompt_tokens ?? 0,
    completion: completion.usage?.completion_tokens ?? 0,
  };
  return { results, usage };
}

export async function draftReply(
  item: RedditItem,
  project: ProjectCtx,
  ctx: { intent: Intent; reason: string }
) {
  const completion = await getOpenAI().chat.completions.create({
    model: MODEL,
    temperature: 0.6,
    max_tokens: 350,
    messages: [
      { role: "system", content: DRAFT_PROMPT },
      {
        role: "user",
        content: [
          `PRODUCT: ${project.product_description}`,
          `BRAND: ${project.brand_name ?? "(none)"}`,
          `SUBREDDIT: r/${item.subreddit} (${item.kind})`,
          item.title ? `${label(item).toUpperCase()}: ${item.title}` : "",
          `TEXT: ${item.body.slice(0, DRAFT_TEXT_CHARS)}`,
          `WHY IT IS A LEAD: ${ctx.reason}`,
        ].filter(Boolean).join("\n"),
      },
    ],
  });

  const text = (completion.choices[0]?.message?.content ?? "").trim().replace(/^["“]|["”]$/g, "").trim();
  const draft = !text || /^skip\b/i.test(text) ? null : text;
  const usage: Usage = {
    prompt: completion.usage?.prompt_tokens ?? 0,
    completion: completion.usage?.completion_tokens ?? 0,
  };
  return { draft, usage };
}
