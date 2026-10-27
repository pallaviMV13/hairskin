import { createFileRoute } from "@tanstack/react-router";
import { AnalyzeFlow } from "@/components/AnalyzeFlow";

export const Route = createFileRoute("/_authenticated/analyze/skin")({
  head: () => ({
    meta: [
      { title: "Skin analysis — Skin & Hair AI" },
      { name: "description", content: "Upload a facial photo for AI-assisted visible skin observations." },
      { property: "og:title", content: "Skin analysis — Skin & Hair AI" },
      { property: "og:description", content: "Visible skin observations from a single photo." },
    ],
  }),
  component: () => <AnalyzeFlow type="skin" />,
});
