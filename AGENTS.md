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
- All buddy text AI (chats, ArtBuddy tips, diagrams) goes through askGoogle in src/lib/google-ai.ts using the owner's own free-tier GEMINI_API_KEY server secret, so running costs stay off paid credits; only pictures still use the Lovable gateway.
- Every AI endpoint calls checkAILimit (src/lib/ai-limits.ts → consume_ai_quota in the database) before any AI call, so per-visitor and site-wide caps hold across servers.
