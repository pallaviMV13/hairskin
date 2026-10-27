import { createOpenAI } from "@ai-sdk/openai";
import { NoObjectGeneratedError, Output, streamText } from "ai";
import { createLovableAiGatewayRunIdFetch } from "./run-id.server";
import { analysisResultSchema, type AnalysisResult, type AnalysisType } from "../analysis-schema";

export const ANALYSIS_MODEL = "openai/gpt-6-astra";

const COMMON = `You are a cautious cosmetic image-observation assistant inside a consumer app. You are NOT a medical device.
Rules:
- Describe only what is directly visible in the photo. Never diagnose any disease or condition, never name medical conditions as conclusions, never infer age, ethnicity, gender, health status or causes.
- If the image is blurry, too dark, overexposed, too far, filtered, or does not show the requested subject, set image_usable=false, explain in image_quality_issues, and return an empty observations array.
- image_quality_score is 0-100 for how suitable the photo is for visual observation.
- confidence is your own qualitative estimate of how clearly the feature is visible; it is not a validated clinical metric.
- Return 2-6 observations, 3-5 limitations, 3-6 general care recommendations (gentle, non-prescriptive, suggest a dermatologist/trichologist for concerns). Keep each item to one or two sentences.`;

const TASKS: Record<AnalysisType, string> = {
  skin: `Task: a facial skin photo. Only assess these visible characteristics: visible blemishes/spots, visible redness, visible shine/oiliness vs dry-looking texture, visible uneven tone, visible under-eye darkness. Use exactly those labels when relevant.`,
  hair: `Task: a scalp or hair photo. Only assess these visible characteristics: visible scalp showing through hair (coverage), apparent hair density in the visible area (relative, not a count), visible flaking, visible breakage/split ends, visible shine/dryness. Do not estimate hair-loss stage or cause.`,
};

export class AnalysisError extends Error {
  constructor(message: string, public status = 500) {
    super(message);
  }
}

export async function runImageAnalysis(type: AnalysisType, dataUrl: string): Promise<AnalysisResult> {
  const apiKey = process.env['LOVABLE_API_KEY'];
  if (!apiKey) throw new AnalysisError("The AI analysis service is not configured yet.", 503);

  const runIdFetch = createLovableAiGatewayRunIdFetch();
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });

  let gatewayError: { status: number | undefined; message: string | undefined } | null = null;
  const result = streamText({
    model: provider.responses(ANALYSIS_MODEL),
    instructions: `${COMMON}\n\n${TASKS[type]}`,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: `Please review this ${type === "skin" ? "facial skin" : "scalp/hair"} photo.` },
          { type: "image", image: new URL(dataUrl) },
        ],
      },
    ],
    output: Output.object({ schema: analysisResultSchema }),
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
    onError: ({ error }) => {
      const e = error as { statusCode?: number; message?: string };
      gatewayError = { status: e?.statusCode, message: e?.message };
    },
  });

  try {
    return await result.output;
  } catch (err) {
    const ge = gatewayError as { status?: number; message?: string } | null;
    const status = ge?.status ?? (err as { statusCode?: number })?.statusCode;
    if (status === 429) throw new AnalysisError("The AI service is busy right now. Please try again in a minute.", 429);
    if (status === 402) throw new AnalysisError("AI usage credits are exhausted for this app. The owner needs to add credits.", 402);
    if (status === 403) throw new AnalysisError("The AI service declined this request.", 403);
    if (NoObjectGeneratedError.isInstance(err)) {
      throw new AnalysisError("The AI model could not produce a valid result for this image. No result was saved.", 502);
    }
    console.error("analysis failed", err);
    throw new AnalysisError("The AI analysis failed. No result was saved — please try again.", 502);
  }
}
