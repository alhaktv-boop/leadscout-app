// src/lib/validation.ts
import { z } from "zod";

export const ProjectInput = z.object({
  name: z.string().trim().min(1, "Give the project a name").max(80),
  product_description: z
    .string().trim()
    .min(20, "Describe your product in at least 20 characters")
    .max(1500),
  brand_name: z.string().trim().max(60).nullable().optional(),
  keywords: z.array(z.string().trim().min(2).max(60)).min(1, "Add at least one keyword").max(15),
  subreddits: z
    .array(
      z.string().trim()
        .transform((s) => s.replace(/^\/?r\//i, ""))
        .pipe(z.string().regex(/^[A-Za-z0-9_]{2,21}$/, "Invalid subreddit name"))
    )
    .min(1, "Add at least one subreddit")
    .max(10),
  exclude_keywords: z.array(z.string().trim().min(2).max(60)).max(15).default([]),
  min_score: z.number().int().min(0).max(100).default(60),
});
