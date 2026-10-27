import { createFileRoute } from "@tanstack/react-router";
import { AnalyzeFlow } from "@/components/AnalyzeFlow";

export const Route = createFileRoute("/_authenticated/analyze/hair")({
  head: () => ({
    meta: [
      { title: "Hair & scalp analysis — Skin & Hair AI" },
      { name: "description", content: "Upload a scalp or hair photo for AI-assisted visible observations." },
      { property: "og:title", content: "Hair & scalp analysis — Skin & Hair AI" },
      { property: "og:description", content: "Visible hair and scalp observations from a single photo." },
    ],
  }),
  component: () => <AnalyzeFlow type="hair" />,
});
