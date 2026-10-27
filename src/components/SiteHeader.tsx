import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

const appLinks = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/analyze/skin", label: "Skin" },
  { to: "/analyze/hair", label: "Hair" },
  { to: "/settings", label: "Privacy & data" },
] as const;

export function SiteHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const out = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="font-display text-lg font-semibold">Skin & Hair AI</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {user &&
            appLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "bg-muted text-foreground" }}
              >
                {l.label}
              </Link>
            ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <Button variant="ghost" onClick={out}>Log out</Button>
          ) : (
            <>
              <Button variant="ghost" asChild><Link to="/auth">Log in</Link></Button>
              <Button variant="hero" asChild><Link to="/auth" search={{ mode: "signup" }}>Get started</Link></Button>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1" onClick={() => setOpen(false)}>
            {user && appLinks.map((l) => (
              <Link key={l.to} to={l.to} className="rounded-lg px-3 py-2 text-sm hover:bg-muted">{l.label}</Link>
            ))}
            {user ? (
              <button onClick={out} className="rounded-lg px-3 py-2 text-left text-sm hover:bg-muted">Log out</button>
            ) : (
              <>
                <Link to="/auth" className="rounded-lg px-3 py-2 text-sm hover:bg-muted">Log in</Link>
                <Link to="/auth" search={{ mode: "signup" }} className="rounded-lg px-3 py-2 text-sm font-medium text-primary">Get started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 text-xs text-muted-foreground sm:flex-row sm:justify-between sm:px-6">
        <p>Skin & Hair AI gives cosmetic, visual observations only. It is not a medical device and does not diagnose.</p>
        <Link to="/privacy" className="hover:text-foreground">Privacy & disclaimer</Link>
      </div>
    </footer>
  );
}
