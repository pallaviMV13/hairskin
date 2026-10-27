import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, Info, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { analysisQuery } from "@/lib/analyses-query";
import { deleteReport } from "@/lib/analysis.functions";

export const Route = createFileRoute("/_authenticated/reports/$id")({
  head: () => ({
    meta: [
      { title: "Analysis report — Skin & Hair AI" },
      { name: "description", content: "Your AI-assisted skin or hair observation report." },
      { property: "og:title", content: "Analysis report — Skin & Hair AI" },
      { property: "og:description", content: "Private analysis report." },
    ],
  }),
  component: Report,
});

const levelStyle: Record<string, string> = {
  none: "bg-teal-soft text-teal",
  mild: "bg-sky-soft text-sky",
  moderate: "bg-lavender-soft text-lavender",
  pronounced: "bg-warning-soft text-warning",
};

function Report() {
  const { id } = Route.useParams();
  const { data: r, isLoading, error } = useQuery(analysisQuery(id));
  const [img, setImg] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const del = useServerFn(deleteReport);
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (r?.image_path) supabase.storage.from("analysis-images").createSignedUrl(r.image_path, 300).then(({ data }) => setImg(data?.signedUrl ?? null));
  }, [r?.image_path]);

  const remove = async () => {
    setDeleting(true);
    try {
      await del({ data: { id } });
      qc.invalidateQueries({ queryKey: ["analyses"] });
      toast.success("Report deleted");
      navigate({ to: "/dashboard" });
    } catch {
      toast.error("Couldn't delete this report");
      setDeleting(false);
    }
  };

  if (isLoading) return <div className="mx-auto max-w-4xl space-y-4 px-4 py-12"><Skeleton className="h-10 w-64" /><Skeleton className="h-64 rounded-3xl" /></div>;
  if (error) return <p className="mx-auto max-w-4xl px-4 py-12 text-destructive">Couldn't load this report.</p>;
  if (!r) return <div className="mx-auto max-w-4xl px-4 py-12"><p>Report not found.</p><Link to="/dashboard" className="text-primary">Back to dashboard</Link></div>;

  const res = r.result;
  const unusable = r.status === "unusable_image";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Dashboard</Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
          <h1 className="text-4xl font-semibold capitalize">{r.analysis_type} report</h1>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="rounded-full" disabled={deleting}>{deleting ? <Loader2 className="animate-spin" /> : <Trash2 />}Delete</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this report?</AlertDialogTitle>
              <AlertDialogDescription>The report and any kept photo will be permanently removed.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={remove}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-[1fr_1.6fr]">
        <div className="space-y-4">
          {img ? <img src={img} alt="Analyzed photo" className="aspect-square w-full rounded-3xl object-cover" /> : (
            <div className="grid aspect-square place-items-center rounded-3xl bg-muted p-6 text-center text-sm text-muted-foreground">Photo deleted after analysis for your privacy.</div>
          )}
          <div className="rounded-2xl border border-border p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Photo quality</p>
            <p className="mt-1 font-display text-3xl">{Math.round(res.image_quality_score)}<span className="text-base text-muted-foreground">/100</span></p>
            <div className="mt-2 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-brand" style={{ width: `${Math.max(0, Math.min(100, res.image_quality_score))}%` }} /></div>
            {res.image_quality_issues.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">{res.image_quality_issues.map((q) => <li key={q}>• {q}</li>)}</ul>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {unusable && (
            <div className="flex gap-3 rounded-2xl bg-warning-soft p-5 text-sm">
              <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
              <div><p className="font-medium">This photo couldn't be reliably analyzed.</p><p className="text-muted-foreground">No observations were produced. Try a sharper, well-lit photo following the tips.</p></div>
            </div>
          )}
          <p className="text-lg">{res.summary}</p>

          {res.observations.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold">Visible observations</h2>
              <div className="mt-3 space-y-3">
                {res.observations.map((o) => (
                  <div key={o.label} className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{o.label}</p>
                      <div className="flex gap-2 text-xs">
                        <span className={`rounded-full px-2.5 py-0.5 capitalize ${levelStyle[o.level] ?? "bg-muted"}`}>{o.level}</span>
                        <span className="rounded-full bg-muted px-2.5 py-0.5 text-muted-foreground">{o.confidence} confidence</span>
                      </div>
                    </div>
                    <p className="mt-1.5 text-sm text-muted-foreground">{o.detail}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-2xl bg-teal-soft p-5">
            <h2 className="text-lg font-semibold">General care guidance</h2>
            <ul className="mt-2 space-y-1.5 text-sm">{res.recommendations.map((x) => <li key={x}>• {x}</li>)}</ul>
          </section>

          <section className="rounded-2xl border border-border p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><Info className="h-4 w-4 text-sky" />Limitations</h2>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              {res.limitations.map((x) => <li key={x}>• {x}</li>)}
              <li>• Confidence levels are the AI model's own estimate, not a validated clinical measure.</li>
              <li>• This is not a medical diagnosis. See a dermatologist or trichologist for any concern.</li>
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">Model: {r.model}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
