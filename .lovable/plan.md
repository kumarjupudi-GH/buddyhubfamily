# Visitor-funded AI and daily usage

## Confirmed choices
- Adults sign in and connect their own provider API accounts. Children use an adult-managed account.
- Identify accounts by sign-in email; no extra profiles or child tracking.
- Never use the owner's AI credits as a fallback.
- Preserve the puzzle homepage, all ten buddies, existing learning features, drawings, and saved device data. No publishing until tests pass and you approve.

## Billing limits to understand
The current app uses the owner's Lovable AI credits. Sign-in alone does not transfer billing to visitors. Available per-user connections do not provide Claude, OpenAI, or Gemini inference billing, so this needs a secure, app-owned provider-credential flow.

Visitors need provider **API** access; ordinary ChatGPT, Claude, or Gemini chat subscriptions are not an API balance. Hosting and database costs still belong to the site owner.

The app can measure its own requests and tokens and estimate their API cost. It cannot promise to read a provider's remaining credits, invoice, or usage in other apps. The 80% alert will therefore refer to a daily spending budget each adult sets for this website, not their provider's entire balance.

## What to build
1. **Adult account and AI connections.** Add sign-in, sign-out, and a private account page for securely submitting, replacing, or removing provider API credentials. Use email identity only. Explain provider eligibility and data-use terms before consent; never ask children for credentials.
2. **Visitor-only AI billing.** Require an authenticated adult account and a connected compatible provider before every chat, tip, diagram, or paid picture request. Keep pages and ArtBuddy's local drawing lessons freely accessible. Preserve current provider routing when the adult has the required connections; otherwise show which connection is needed, without silently switching models or charging you. Any fallback uses only that adult's connected account.
3. **Daily usage.** Record each AI attempt with account, buddy, provider, model, time, outcome, reported input/output tokens, and available modality usage. Include fallback attempts and failures; mark unavailable usage or uncertain billing as unknown. No question text or drawing contents in reporting.
4. **Private reports.** Each adult sees only their own daily totals and request history. A separate administrator dashboard shows registered accounts, signed-in website visits, provider usage, tokens, and estimated daily costs. Anonymous visitors remain anonymous; family activity is grouped under the adult, not individual children. Only an explicitly assigned administrator can see all accounts.
5. **80% warnings.** Each adult sets a daily budget and reporting timezone. Show an in-app warning at 80%, including inside buddies. Use reported usage and versioned published provider rates, clearly labeled as estimates. Do not add email notifications or silently impose a new spending cutoff; provider-enforced caps remain the dependable protection against actual bills.
6. **Home navigation.** The eight family buddies already link to the website home. Add the missing link in BrainBoost and a distinct website-home link on every ArtBuddy screen, preserving its existing drawing-home button.

## Technical safeguards
- Encrypt provider keys server-side using a securely generated encryption secret. Store ciphertext in a server-only table; never return saved keys, put them in browser storage, or log credentials. Fix provider destinations and models server-side so supplied keys cannot be forwarded to arbitrary URLs.
- Authenticate and authorize every directly callable AI/reporting endpoint. Keep existing quota checks and use authenticated account IDs for visitor quotas rather than treating a shared family IP as identity.
- Add separate administrator roles and owner-scoped usage policies through additive database changes with explicit grants. No schema or data deletion. Do not automatically make the first registrant an administrator; assign the requesting owner's verified account explicitly.
- Add provider-native adapters only for the existing AI capabilities, after checking supported APIs/models. Keep existing UI response formats. If a current model/capability is unavailable through a provider's direct API, report that mismatch and obtain approval for a replacement rather than silently degrading it.
- Keep credential access, token accounting, provider pricing, and reporting separate from buddy personalities and shared UI.

## Verification and release
- Test that signed-out requests, missing connections, and provider errors cannot call owner-funded AI.
- Test account isolation, administrator access, adult-only credential handling, 80% boundary behavior, daily timezone boundaries, and fallback accounting.
- Exercise all ten buddies, diagrams, picture generation, and Home navigation on desktop and mobile using a consenting adult's funded API connections. These checks consume that adult's provider quota or money; credentials must be entered through the private page, never chat.
- Confirm drawings and existing device data remain intact. Report anything unverified, including unavailable provider balances and missing connections.
- Request publication approval only after the applicable checks pass. Until publication, the live site's existing owner-funded behavior remains unchanged.