import { createFileRoute, Link } from "@tanstack/react-router";
import { Droplets, Lock, ScanFace, ShieldCheck, Trash2, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Skin & Hair AI Analyzer — private, honest photo observations" },
      { name: "description", content: "Upload a face or scalp photo and get AI-assisted visual observations, quality checks and general care tips. Private by default." },
      { property: "og:title", content: "Skin & Hair AI Analyzer" },
      { property: "og:description", content: "AI-assisted visual observations for skin and hair photos — no diagnoses, private storage, delete anytime." },
    ],
  }),
  component: Index,
});

const features = [
  { icon: ScanFace, title: "Skin observations", text: "Visible blemishes, redness, shine, uneven tone and under-eye darkness — described, never diagnosed." },
  { icon: Wind, title: "Hair & scalp observations", text: "Visible scalp coverage, relative density, flaking and breakage from a close-up photo." },
  { icon: Droplets, title: "Quality checks first", text: "Blurry, dark or off-target photos are flagged instead of producing a guessed result." },
  { icon: Lock, title: "Private by default", text: "Photos live in private storage and are deleted right after analysis unless you choose to keep them." },
  { icon: ShieldCheck, title: "Honest limits", text: "Every report lists what the AI can't tell you, with model-estimated confidence." },
  { icon: Trash2, title: "You own your data", text: "Delete any report, all your data, or your whole account in one click." },
];

function Index() {
  const { user } = useAuth();
  const start = user ? "/dashboard" : "/auth";
  return (
    <>
      <section className="relative overflow-hidden bg-hero">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-teal" /> AI-assisted · not a medical device
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.05] sm:text-6xl">
              See your skin & hair <span className="text-brand italic">more clearly.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">
              Upload a photo, get careful visual observations, a quality check, and gentle care guidance — with every limitation spelled out.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="hero" size="lg" asChild><Link to={start}>Start an analysis</Link></Button>
              <Button variant="outline" size="lg" className="rounded-full" asChild><Link to="/privacy">How we protect you</Link></Button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 rounded-[2.5rem] bg-brand opacity-20 blur-3xl" />
            <img src={hero} alt="Portrait lit in soft lavender and teal light" width={1280} height={1280} className="relative aspect-square w-full rounded-[2rem] object-cover shadow-soft" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="max-w-xl text-3xl font-semibold sm:text-4xl">Built to be useful — and honest about what AI can see.</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <f.icon className="h-6 w-6 text-teal" />
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="grid gap-6 rounded-3xl bg-lavender-soft p-8 md:grid-cols-3 md:p-12">
          {["Give consent & upload a clear, well-lit photo", "We check quality, then the AI describes visible features", "Read your report, keep it or delete it any time"].map((s, i) => (
            <div key={s}>
              <span className="font-display text-4xl text-lavender">0{i + 1}</span>
              <p className="mt-2 font-medium">{s}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
