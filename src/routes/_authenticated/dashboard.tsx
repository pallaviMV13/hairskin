import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, ScanFace, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { analysesQuery } from "@/lib/analyses-query";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Skin & Hair AI" },
      { name: "description", content: "Your recent skin and hair analyses." },
      { property: "og:title", content: "Dashboard — Skin & Hair AI" },
      { property: "og:description", content: "Your private analysis history." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<"all" | "skin" | "hair">("all");
  const { data, isLoading, error, refetch } = useQuery(analysesQuery(filter === "all" ? undefined : filter));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="text-sm text-muted-foreground">{user?.email}</p>
      <h1 className="text-4xl font-semibold">Your dashboard</h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link to="/analyze/skin" className="group rounded-3xl bg-lavender-soft p-6 transition-shadow hover:shadow-soft">
          <ScanFace className="h-7 w-7 text-lavender" />
          <h2 className="mt-4 text-xl font-semibold">New skin analysis</h2>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">Upload a face photo <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></p>
        </Link>
        <Link to="/analyze/hair" className="group rounded-3xl bg-teal-soft p-6 transition-shadow hover:shadow-soft">
          <Wind className="h-7 w-7 text-teal" />
          <h2 className="mt-4 text-xl font-semibold">New hair analysis</h2>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">Upload a scalp photo <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></p>
        </Link>
      </div>

      <div className="mt-12 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold">Reports</h2>
        <div className="flex gap-1 rounded-full bg-muted p-1">
          {(["all", "skin", "hair"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-1.5 text-sm capitalize ${filter === f ? "bg-card shadow-soft" : "text-muted-foreground"}`}>{f}</button>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {isLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        {error && (
          <div className="rounded-2xl border border-destructive/30 p-5 text-sm text-destructive">
            Couldn't load your reports. <button className="underline" onClick={() => refetch()}>Retry</button>
          </div>
        )}
        {data && data.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
            No reports yet. Start with a skin or hair analysis above.
          </div>
        )}
        {data?.map((r) => (
          <Link key={r.id} to="/reports/$id" params={{ id: r.id }} className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-soft">
            <div className="flex items-center gap-4">
              <span className={`grid h-10 w-10 place-items-center rounded-xl ${r.analysis_type === "skin" ? "bg-lavender-soft text-lavender" : "bg-teal-soft text-teal"}`}>
                {r.analysis_type === "skin" ? <ScanFace className="h-5 w-5" /> : <Wind className="h-5 w-5" />}
              </span>
              <div>
                <p className="font-medium capitalize">{r.analysis_type} analysis</p>
                <p className="line-clamp-1 text-sm text-muted-foreground">{r.result?.summary}</p>
              </div>
            </div>
            <div className="shrink-0 text-right text-xs text-muted-foreground">
              {new Date(r.created_at).toLocaleDateString()}
              {r.status === "unusable_image" && <p className="text-warning">Photo unusable</p>}
            </div>
          </Link>
        ))}
      </div>
      {data && data.length > 0 && <Button variant="link" asChild className="mt-4 px-0"><Link to="/settings">Manage your data</Link></Button>}
    </div>
  );
}
