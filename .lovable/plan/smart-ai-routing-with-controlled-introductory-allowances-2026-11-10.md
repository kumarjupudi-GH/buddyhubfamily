# Smart AI routing with controlled introductory allowances

## What the current code does
- Adult accounts supply their own encrypted provider keys. Chats prefer a saved OpenRouter key, otherwise use question-based Claude/OpenAI/Gemini selection. There is no automatic provider retry.
- ArtBuddy teaching and educational diagrams still require Gemini directly; generated pictures require OpenAI. This explains why an OpenRouter-only connection does not cover every AI feature.
- Daily dollar budgets currently trigger warnings only, not spending cutoffs. Hourly account and daily site request caps are enforced separately. The home card’s 1,000/250/100 numbers are display values, not those enforced limits.
- Existing private reports show registrations, requests and estimated costs. There is no introductory allowance, administrator funding pool, provider switches or paid-AI emergency stop.
- This review inspected source and migration definitions, not authenticated provider availability or live spending. The OpenRouter answer fix still needs an authenticated real-question check.

## Funding change requiring approval
This proposal adds an **explicitly enabled administrator-funded introductory mode**, an exception to the previous visitor-pays-only rule. Existing visitor-owned connections remain available. Do not silently move a visitor request onto an administrator account.

New administrator funding starts **disabled**, with a **$0 introductory allowance and $0 total spending authorization**. You set the allowance, daily question cap, maximum per-user spend, total pool and enabled providers before activation. These are website USD allowances, not transferable OpenAI/Claude credits or ChatGPT subscriptions. Only authenticated adult accounts receive them; local learning remains accessible without signing in.

## Small implementation stages
Each stage is tested before starting the next; preserve the current UI, buddy files, accounts, keys and integrations. Record the current version and an additive rollback procedure before implementation. No publishing without separate approval.

1. **Administrator controls and one-time allowances.** Extend the existing private admin page with funding controls, independent OpenAI/Claude switches and an emergency stop. Grant an introductory allowance exactly once per verified account, including registrations while the feature is enabled. Do not grant it retroactively to existing accounts by default. Show remaining website allowance on the account and home status card. Test authorization, zero defaults, daily/per-user/site caps, and duplicate claims. One-account enforcement does not prevent someone creating multiple accounts.
2. **Hard spending safeguards.** Before sending any funded request, atomically reserve its conservative maximum cost against both the user and total pool, including concurrent requests. Settle against returned token usage afterward. Keep uncertain timeout/error costs reserved until reconciled rather than presenting them as free. Record funding source, request type, attempts, reservations and model/rate versions. Reject unknown-price models and unavailable budget checks. Preserve the existing 80% warning. Enforce these safeguards for every sponsored AI path, including visuals; leave sponsored image generation disabled until its modality pricing is supported.
3. **One shared routing service.** Make OpenAI the primary sponsored text provider, using a low-cost model for simple questions and the current standard model for fuller tutoring. Allow administrator task overrides to Claude. Use at most one Claude fallback, only if enabled, affordable and explicitly allowed; never retry ambiguous timeouts where the first request may have been billed. Preserve visitor-funded Gemini/OpenRouter behavior as a separately selected mode, not a silent paid fallback. Add bounded input/history, timeouts, output limits and request IDs to stop duplicate submissions from sending duplicate AI calls.
4. **Connect and verify all buddies.** Keep existing response formats, teaching prompts, diagrams, local tutorials and saved drawings. Route text teaching and SVG diagrams through the shared service so they need not require a Gemini key in sponsored mode. Keep existing visitor-funded pictures intact. Correct status counts using recorded request types and authoritative totals rather than a 200-row sample or model-name guessing. Verify Homework Buddy answers, diagrams, ArtBuddy teaching and representative family buddies with a real signed-in account, then check all endpoints and reports. Compare low-cost and standard model answers on representative educational questions; do not claim a provider is inherently more accurate.

## Expected provider costs
Official public prices retrieved November 10, 2026, USD per million tokens:

| Candidate | Input | Output | Hypothetical answer: 1,000 input + 500 output tokens |
|---|---:|---:|---:|
| OpenAI `gpt-6-luna`, simple-question candidate | $0.10 | $0.50 | $0.00035 |
| OpenAI `gpt-6.1-terra`, current standard model | $1.00 | $5.00 | $0.00350 |
| Claude Haiku 4.5, fallback | $1.00 | $5.00 | $0.00350 |

At that hypothetical workload, 1,000 successful answers cost approximately $0.35 or $3.50 respectively. A billed standard-model attempt plus a billed Claude fallback could cost $0.007 for the same assumed token counts. Actual totals depend on history, hidden reasoning tokens, output length, retries, caching and visuals. These are estimates, not invoices or observed savings. Validate model access and quality before enabling each model. Hosting/database costs and generated images are excluded; diagrams are additional text requests. Provider usage yields list-rate estimates; actual provider charges require provider billing reconciliation and may differ.

Sources: https://developers.openai.com/api/docs/pricing and https://platform.claude.com/docs/en/about-claude/pricing

## Affected files and technical details
- Extend `src/lib/visitor-policy.ts`, `src/lib/visitor-ai.server.ts`, `src/lib/ai-limits.ts` and `src/lib/visitor-account.functions.ts`.
- Add small shared server-only routing/funding helpers and additive database migrations for administrator policy, one-time grants, atomic reservations and request deduplication. Keep administrator roles in the existing protected `user_roles` system; users cannot edit funding or grant records.
- Update the existing `chat`, `buddy-chat`, `teach`, `diagram`, `picture` and `visitor-session` endpoints only as needed to call common safeguards and report authoritative totals. Preserve their caller contracts.
- Update `src/components/visitor-account.tsx` for balances and admin settings. Preserve the homepage puzzle and existing account navigation. Buddy frontend changes only if needed to send stable request IDs; preserve ArtBuddy’s local curriculum.
- Add focused tests beside `src/test/visitor-ai.test.ts`, `visitor-policy.test.ts` and `ai-router.test.ts`; document changed funding boundaries in `AGENTS.md` and update the roadmap after approval.
- Keep credentials encrypted/server-only; request any administrator provider connection securely after approval. Never reuse Lovable/workspace AI credentials or expose stored key material.

## Risks and activation gates
- Administrator funding is real paid usage. Approval of this plan does not activate billing or authorize an unspecified spending amount.
- Costs cannot be known exactly before inference; conservative reservations, token limits and provider-side caps reduce exposure, but provider invoices remain authoritative. An emergency stop blocks new dispatches, not already-sent requests.
- Provider eligibility and child-data terms still apply to adult-managed family use.
- Live testing requires a signed-in account with authorized provider access and an explicit small test budget. If either is unavailable, report the blocker instead of claiming end-to-end success.
- Retain rollback to the previous visitor-funded flow; do not delete old credentials, data or migrations. Disable sponsored mode first if a problem appears.

**Awaiting your approval before any application or database changes.**