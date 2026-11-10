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

- Static buddies remain independently accessible; visitor AI credentials and private usage reporting belong to authenticated adult accounts, never child profiles, so local learning remains available without sign-in.
- Store provider credentials only as server-encrypted ciphertext; visitor-mode adapters never charge the owner or fall back to workspace credentials, while sponsored mode requires explicit administrator funding authorization.
- New family buddies are a small index.html config on public/apps/buddy-shared engine, with personas server-side in src/lib/buddies.ts, so prompts stay private and buddies stay consistent.
- The home puzzle is generated from src/lib/buddy-catalog.ts; a null href routes to /coming-soon/$slug so new buddies never break links.
- All text AI paths use visitorText: visitor mode preserves pickProvider and visitor-owned keys without retries; explicitly selected sponsored mode uses one shared OpenAI/Claude dispatcher with atomic budgets and a single permitted definitive-rejection fallback.
- Sponsored AI is a separate adult-selected mode, disabled by default; only explicitly configured administrator-owned provider connections may fund it, with atomic user/pool reservations and no workspace gateway fallback, so paid exposure stays bounded.
- Static buddies load the browser session bundle from public/apps/buddy-shared/session.js; regenerate it from src/lib/buddy-session.client.ts after session changes, using only public Vite configuration, so all buddies share the adult's authenticated account.
- Every AI endpoint calls checkAILimit (src/lib/ai-limits.ts → consume_ai_quota in the database) before any AI call, so per-visitor and site-wide caps hold across servers.
- ArtBuddy's additive local curriculum lives in curriculum.js and extends the existing lesson library; learning-level selection only updates local settings, so tutorials and challenges stay available without AI or accounts and saved drawings remain intact.
