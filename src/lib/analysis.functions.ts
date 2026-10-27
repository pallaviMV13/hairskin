import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { MAX_BYTES, MIN_BYTES, type AnalysisType } from "./analysis-schema";

const BUCKET = "analysis-images";

function sniffMime(bytes: Uint8Array): string | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) return "image/webp";
  return null;
}

function toBase64(bytes: Uint8Array) {
  let s = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) s += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(s);
}

export const analyzeImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { type: AnalysisType; path: string; consent: boolean; retainImage: boolean }) => {
    if (input.type !== "skin" && input.type !== "hair") throw new Error("Invalid analysis type");
    if (typeof input.path !== "string" || input.path.includes("..")) throw new Error("Invalid image path");
    if (input.consent !== true) throw new Error("Consent is required before processing an image");
    return { type: input.type, path: input.path, consent: true, retainImage: !!input.retainImage };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (!data.path.startsWith(`${userId}/`)) return { ok: false as const, error: "You can only analyze your own uploads." };

    const cleanup = () => supabase.storage.from(BUCKET).remove([data.path]);

    const { data: blob, error: dlErr } = await supabase.storage.from(BUCKET).download(data.path);
    if (dlErr || !blob) return { ok: false as const, error: "Could not read the uploaded image. Please upload again." };

    const bytes = new Uint8Array(await blob.arrayBuffer());
    const mime = sniffMime(bytes);
    if (!mime) { await cleanup(); return { ok: false as const, error: "Only JPEG, PNG or WebP images are accepted." }; }
    if (bytes.length > MAX_BYTES) { await cleanup(); return { ok: false as const, error: "Image is larger than 8 MB." }; }
    if (bytes.length < MIN_BYTES) { await cleanup(); return { ok: false as const, error: "Image is too small to analyze reliably." }; }

    const { runImageAnalysis, AnalysisError, ANALYSIS_MODEL } = await import("./ai/analyze.server");
    let result;
    try {
      result = await runImageAnalysis(data.type, `data:${mime};base64,${toBase64(bytes)}`);
    } catch (e) {
      await cleanup();
      return { ok: false as const, error: e instanceof AnalysisError ? e.message : "The AI analysis failed." };
    }

    const keep = data.retainImage;
    if (!keep) await cleanup();

    const { data: row, error } = await supabase
      .from("analyses")
      .insert({
        user_id: userId,
        analysis_type: data.type,
        status: result.image_usable && result.subject_matches_task ? "completed" : "unusable_image",
        result,
        model: ANALYSIS_MODEL,
        image_path: keep ? data.path : null,
        image_retained: keep,
      })
      .select("id")
      .single();
    if (error || !row) return { ok: false as const, error: "Analysis finished but could not be saved." };
    return { ok: true as const, id: row.id };
  });

export const deleteReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: row } = await supabase.from("analyses").select("image_path").eq("id", data.id).maybeSingle();
    if (row?.image_path) await supabase.storage.from(BUCKET).remove([row.image_path]);
    const { error } = await supabase.from("analyses").delete().eq("id", data.id);
    if (error) throw new Error("Could not delete report");
    return { ok: true };
  });

async function wipeUserData(supabase: any, userId: string) {
  const { data: files } = await supabase.storage.from(BUCKET).list(userId, { limit: 1000 });
  if (files?.length) await supabase.storage.from(BUCKET).remove(files.map((f: { name: string }) => `${userId}/${f.name}`));
  await supabase.from("analyses").delete().eq("user_id", userId);
}

export const deleteAllData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await wipeUserData(context.supabase, context.userId);
    return { ok: true };
  });

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await wipeUserData(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(context.userId);
    if (error) throw new Error("Could not delete account");
    return { ok: true };
  });
