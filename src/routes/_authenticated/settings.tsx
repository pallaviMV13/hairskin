import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteAccount, deleteAllData } from "@/lib/analysis.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Privacy & data — Skin & Hair AI" },
      { name: "description", content: "Delete your reports, photos or account." },
      { property: "og:title", content: "Privacy & data — Skin & Hair AI" },
      { property: "og:description", content: "Manage and delete your data." },
    ],
  }),
  component: Settings,
});

function Confirm({ label, title, desc, onConfirm, destructive }: { label: string; title: string; desc: string; onConfirm: () => void; destructive?: boolean }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild><Button variant={destructive ? "destructive" : "outline"} className="rounded-full">{label}</Button></AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>{title}</AlertDialogTitle><AlertDialogDescription>{desc}</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={onConfirm}>Confirm</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function Settings() {
  const wipe = useServerFn(deleteAllData);
  const kill = useServerFn(deleteAccount);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const doWipe = async () => {
    setBusy(true);
    try { await wipe(); qc.invalidateQueries({ queryKey: ["analyses"] }); toast.success("All your reports and photos were deleted"); }
    catch { toast.error("Couldn't delete your data"); }
    setBusy(false);
  };
  const doKill = async () => {
    setBusy(true);
    try { await kill(); await supabase.auth.signOut(); toast.success("Your account was deleted"); navigate({ to: "/" }); }
    catch { toast.error("Couldn't delete your account"); setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-4xl font-semibold">Privacy & data</h1>
      <p className="mt-2 text-muted-foreground">Photos are stored privately and only you can access them. Deletions are permanent.</p>
      <div className="mt-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border p-6">
          <div><h2 className="text-lg font-semibold">Delete all data</h2><p className="text-sm text-muted-foreground">Removes every report and kept photo. Your account stays.</p></div>
          <Confirm label={busy ? "Working…" : "Delete all data"} title="Delete all your data?" desc="All reports and photos will be permanently removed." onConfirm={doWipe} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-destructive/30 p-6">
          <div><h2 className="text-lg font-semibold">Delete account</h2><p className="text-sm text-muted-foreground">Deletes your data and your login. This can't be undone.</p></div>
          <Confirm destructive label={busy ? "Working…" : "Delete account"} title="Delete your account?" desc="Your account, reports and photos will be permanently deleted." onConfirm={doKill} />
        </div>
      </div>
    </div>
  );
}
