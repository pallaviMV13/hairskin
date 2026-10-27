<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Skin & Hair AI Analyzer
- Image analysis runs only in server functions (`src/lib/analysis.functions.ts` -> `src/lib/ai/analyze.server.ts`) via Lovable AI Gateway Responses with a strict zod schema; never return fabricated results — failures surface as errors and nothing is saved.
- Photos go to the private `analysis-images` bucket under `<userId>/`; the server re-validates magic bytes/size and deletes the photo after analysis unless the user opted to retain it.
- `_authenticated` routes are `ssr: false` because the session lives in browser storage; data reads use the browser client under RLS.
