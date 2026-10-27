import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import "@lovable.dev/cloud-auth-js/styles.css";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";

type Mode = "login" | "signup" | "forgot";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { mode?: Mode } => ({
    mode: s.mode === "signup" || s.mode === "forgot" ? s.mode : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — Skin & Hair AI Analyzer" },
      { name: "description", content: "Log in or create an account to analyze skin and hair photos privately." },
      { property: "og:title", content: "Sign in — Skin & Hair AI Analyzer" },
      { property: "og:description", content: "Log in or create your private Skin & Hair AI account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const [mode, setMode] = useState<Mode>(search.mode ?? "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate({ to: "/dashboard" });
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/dashboard" } });
        if (error) throw error;
        if (!data.session) setNotice("Check your inbox to confirm your email, then log in.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setNotice("If that email has an account, a reset link is on its way.");
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const social = async (provider: "google" | "lovable") => {
    const r = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
    if (r.error) toast.error(r.error.message ?? "Sign-in failed");
  };

  const title = mode === "login" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset your password";

  return (
    <div className="bg-hero">
      <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-12">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-soft">
          <h1 className="text-3xl font-semibold">{title}</h1>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {mode !== "forgot" && (
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            )}
            {notice && <p className="rounded-xl bg-teal-soft p-3 text-sm">{notice}</p>}
            <Button type="submit" variant="hero" className="w-full" disabled={busy}>
              {busy ? "Please wait…" : mode === "login" ? "Log in" : mode === "signup" ? "Sign up" : "Send reset link"}
            </Button>
          </form>

          {mode !== "forgot" && (
            <>
              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
              <div className="space-y-2">
                <Button variant="outline" className="w-full rounded-full" onClick={() => social("google")}>Continue with Google</Button>
                <button type="button" className="lovable-auth-button w-full" onClick={() => social("lovable")}>Continue with Lovable</button>
              </div>
            </>
          )}

          <div className="mt-6 flex flex-wrap justify-between gap-2 text-sm">
            {mode === "login" ? (
              <>
                <button className="text-primary hover:underline" onClick={() => setMode("signup")}>Create an account</button>
                <button className="text-muted-foreground hover:underline" onClick={() => setMode("forgot")}>Forgot password?</button>
              </>
            ) : (
              <button className="text-primary hover:underline" onClick={() => setMode("login")}>Back to log in</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
