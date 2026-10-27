import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ImagePlus, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/lib/auth";
import { analyzeImage } from "@/lib/analysis.functions";
import { ALLOWED_MIME, MAX_BYTES, MIN_BYTES, MIN_DIMENSION, type AnalysisType } from "@/lib/analysis-schema";

const COPY: Record<AnalysisType, { title: string; hint: string; tips: string[] }> = {
  skin: {
    title: "Skin analysis",
    hint: "A front-facing photo of your face, no makeup or filters.",
    tips: ["Soft, even daylight — no harsh shadows", "Face fills most of the frame", "Remove glasses; hair away from face", "Hold still to avoid blur"],
  },
  hair: {
    title: "Hair & scalp analysis",
    hint: "A close-up of your scalp parting, crown or hairline.",
    tips: ["Bright, even light from above", "Part hair to show the scalp", "Keep the camera 10–20 cm away", "Dry, unstyled hair works best"],
  },
};

function readDims(file: File) {
  return new Promise<{ w: number; h: number }>((res, rej) => {
    const img = new Image();
    img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => rej(new Error("Could not read image"));
    img.src = URL.createObjectURL(file);
  });
}

export function AnalyzeFlow({ type }: { type: AnalysisType }) {
  const c = COPY[type];
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const run = useServerFn(analyzeImage);
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [retain, setRetain] = useState(false);
  const [stage, setStage] = useState<"idle" | "uploading" | "analyzing">("idle");

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const pick = async (f: File | undefined) => {
    setError(null);
    setWarning(null);
    if (!f) return;
    if (!ALLOWED_MIME.includes(f.type as (typeof ALLOWED_MIME)[number])) return setError("Please choose a JPEG, PNG or WebP image.");
    if (f.size > MAX_BYTES) return setError("That image is over 8 MB. Please use a smaller one.");
    if (f.size < MIN_BYTES) return setError("That image is too small to analyze reliably.");
    try {
      const { w, h } = await readDims(f);
      if (Math.min(w, h) < MIN_DIMENSION) return setError(`Image is ${w}×${h}px. Please use at least ${MIN_DIMENSION}px on the shortest side.`);
      if (Math.min(w, h) < 800) setWarning("Resolution is on the low side — results may be less reliable.");
    } catch {
      return setError("We couldn't read that image file.");
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async () => {
    if (!file || !user || !consent) return;
    setError(null);
    setStage("uploading");
    const ext = (file.type.split("/")[1] ?? "jpg").replace("jpeg", "jpg");
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("analysis-images").upload(path, file, { contentType: file.type });
    if (upErr) {
      setStage("idle");
      return setError("Upload failed. Please check your connection and try again.");
    }
    setStage("analyzing");
    try {
      const r = await run({ data: { type, path, consent: true, retainImage: retain } });
      if (!r.ok) {
        setStage("idle");
        return setError(r.error);
      }
      qc.invalidateQueries({ queryKey: ["analyses"] });
      navigate({ to: "/reports/$id", params: { id: r.id } });
    } catch {
      setStage("idle");
      setError("Something went wrong while analyzing. No result was saved.");
    }
  };

  const busy = stage !== "idle";

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="text-4xl font-semibold">{c.title}</h1>
      <p className="mt-2 text-muted-foreground">{c.hint}</p>

      <div className="mt-8 grid gap-8 md:grid-cols-[1.3fr_1fr]">
        <div>
          <div
            className="relative grid aspect-[4/3] cursor-pointer place-items-center overflow-hidden rounded-3xl border-2 border-dashed border-border bg-muted/50 transition-colors hover:border-primary/50"
            onClick={() => !busy && inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); if (!busy) pick(e.dataTransfer.files[0]); }}
          >
            {preview ? (
              <>
                <img src={preview} alt="Selected photo preview" className="h-full w-full object-cover" />
                {busy && (
                  <div className="absolute inset-0 bg-foreground/20">
                    <div className="animate-scan h-[10%] w-full bg-gradient-to-b from-transparent via-teal/60 to-transparent" />
                  </div>
                )}
                {!busy && (
                  <button
                    className="absolute right-3 top-3 rounded-full bg-card p-1.5 shadow-soft"
                    onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
                    aria-label="Remove photo"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </>
            ) : (
              <div className="text-center text-muted-foreground">
                <ImagePlus className="mx-auto h-10 w-10 text-lavender" />
                <p className="mt-3 font-medium text-foreground">Drop a photo or click to upload</p>
                <p className="text-xs">JPEG, PNG or WebP · up to 8 MB · min {MIN_DIMENSION}px</p>
              </div>
            )}
            <input ref={inputRef} type="file" accept={ALLOWED_MIME.join(",")} className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
          </div>
          {warning && <p className="mt-3 flex items-center gap-2 rounded-xl bg-warning-soft p-3 text-sm"><AlertTriangle className="h-4 w-4 text-warning" />{warning}</p>}
          {error && <p className="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-teal-soft p-5">
            <h2 className="text-base font-semibold">For a reliable result</h2>
            <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              {c.tips.map((t) => <li key={t}>• {t}</li>)}
            </ul>
          </div>

          <div className="space-y-3 rounded-2xl border border-border p-5">
            <label className="flex gap-3 text-sm">
              <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} disabled={busy} />
              <span>I consent to this photo being processed by an AI model to generate cosmetic observations. I understand this is not a medical diagnosis.</span>
            </label>
            <label className="flex gap-3 text-sm">
              <Checkbox checked={retain} onCheckedChange={(v) => setRetain(v === true)} disabled={busy} />
              <span className="text-muted-foreground">Keep the photo privately with my report (otherwise it's deleted right after analysis).</span>
            </label>
          </div>

          <Button variant="hero" size="lg" className="w-full" disabled={!file || !consent || busy} onClick={submit}>
            {busy ? <><Loader2 className="animate-spin" />{stage === "uploading" ? "Uploading securely…" : "Analyzing — about 20 seconds…"}</> : "Analyze photo"}
          </Button>
        </div>
      </div>
    </div>
  );
}
