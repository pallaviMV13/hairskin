import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy & disclaimer — Skin & Hair AI" },
      { name: "description", content: "How Skin & Hair AI handles your photos, what the AI can and cannot do, and how to delete your data." },
      { property: "og:title", content: "Privacy & disclaimer — Skin & Hair AI" },
      { property: "og:description", content: "Private storage, consent before processing, and honest AI limitations." },
    ],
  }),
  component: Privacy,
});

const sections = [
  ["Not a medical device", "Skin & Hair AI gives cosmetic, visual observations from a single photo. It does not diagnose skin disease, alopecia, scalp conditions or the cause of hair loss. For any concern, see a dermatologist or trichologist."],
  ["How analysis works", "Your photo is sent securely to a general-purpose vision AI model through our server. The model is instructed to describe only visible features and to flag poor-quality photos. Confidence levels are the model's own estimate, not a validated clinical measure."],
  ["Your photos", "Photos are stored in private storage only you can access. By default they are deleted immediately after analysis. You can opt in to keep a photo with its report and delete it later."],
  ["Consent", "We ask for your explicit consent before every analysis. Nothing is processed without it."],
  ["Deleting your data", "From Privacy & data you can delete individual reports, all your data, or your entire account. Deletion is permanent."],
];

function Privacy() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-4xl font-semibold">Privacy & disclaimer</h1>
      <div className="mt-10 space-y-8">
        {sections.map(([t, b]) => (
          <section key={t}>
            <h2 className="text-xl font-semibold">{t}</h2>
            <p className="mt-2 text-muted-foreground">{b}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
