import { z } from "zod";

export type AnalysisType = "skin" | "hair";

export const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_BYTES = 8 * 1024 * 1024;
export const MIN_BYTES = 15 * 1024;
export const MIN_DIMENSION = 400;

export const analysisResultSchema = z.object({
  image_usable: z.boolean(),
  image_quality_score: z.number(),
  image_quality_issues: z.array(z.string()),
  subject_matches_task: z.boolean(),
  summary: z.string(),
  observations: z.array(
    z.object({
      label: z.string(),
      detail: z.string(),
      level: z.enum(["none", "mild", "moderate", "pronounced"]),
      confidence: z.enum(["low", "medium", "high"]),
    }),
  ),
  limitations: z.array(z.string()),
  recommendations: z.array(z.string()),
});

export type AnalysisResult = z.infer<typeof analysisResultSchema>;
