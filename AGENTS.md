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

- Apps under public/apps open independently with no profiles, trackers or dashboards, so any buddy works on its own.
- New family buddies are a small index.html config on public/apps/buddy-shared engine, with personas server-side in src/lib/buddies.ts, so prompts stay private and buddies stay consistent.
- The home puzzle is generated from src/lib/buddy-catalog.ts; a null href routes to /coming-soon/$slug so new buddies never break links.
- Visitor-paid inference uses authenticated server-side provider calls and encrypted per-user keys; never fall back to workspace-funded inference.
- Static buddies use a same-origin hidden auth bridge for AI calls; bearer tokens stay in the bridge, never in parent pages or messages.
- Model choices come from each user's provider model list; store only the chosen provider/model on the device and preserve existing response budgets.
