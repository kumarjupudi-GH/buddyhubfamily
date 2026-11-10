# BuddyFamily upgrade — budget plan

Your document asks for 10 modules. Building all at once would be costly, so the plan splits it into small phases. Each phase is approved and checked before the next one starts. Every buddy app and the puzzle home page stay as they are now.

## Note first
Earlier you asked me to remove the visitor API-key setup. This plan brings it back, but only for signed-in users. Guests can still open the home page.

## Phase 1: Sign-in (small)
- Sign in with Google, or with email and password. Includes email verification and a "forgot password" page.
- A compact account menu in the top-right corner, with sign out.
- Protected roles: you (Proprietor) and Registered User. You'll be set as Proprietor using your email, never from the app.

## Phase 2: Each person's own AI keys (medium)
- A "My AI" page where users paste their OpenAI and Claude keys, with official links and steps. Keys are checked, stored encrypted on the server, and can be removed.
- All buddies send questions through the user's own key. If no key is set, the user sees setup instructions. Your site's AI credits are never used for users' questions.
- Simple questions use a cheaper model, with an optional Advanced switch.

## Phase 3: Personal usage panel (small)
- Top-right panel showing connection status, model, number of requests, and estimated cost (from tokens used).
- When a provider doesn't share balances, the panel shows "Balance unavailable", with an "Add credits" link to that provider's page.

## Phase 4: Proprietor admin panel (medium)
- User list, request counts, average response time, error rates, and estimated cost per provider. Keys are never shown.
- Thumbs up/down feedback on answers, with a summary for you.
- Site visit numbers from the built-in analytics. No custom tracker.

## Skipped to save credits (can add later)
- Automatic switching to a backup provider (Phase 2 only offers a "try other provider" button)
- Detailed traffic dashboards beyond the built-in analytics

## Technical details
- Cloud auth with profiles + user_roles tables and a has_role() function. The Proprietor is set with a one-time SQL row.
- user_ai_keys table: keys are AES-GCM encrypted on the server with a secret ENCRYPTION_KEY. Only server functions can read it (no client access).
- ai_requests log (user, buddy, provider, model, tokens, latency, status) feeds both dashboards. feedback table.
- buddy-chat, chat and teach endpoints require a bearer token and call OpenAI or Anthropic directly. The Lovable gateway is removed for users' questions.
- The shared buddy.js gets a single auth-token hook, so the 10 apps barely change.
