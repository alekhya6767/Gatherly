# Engineering decisions

## Architecture

- Feature-based organization:
  - `features/` contains UI and user-facing functionality.
  - `lib/` contains domain logic, validation, and integrations.
  - `types/` contains shared TypeScript types.

## Data strategy: Local-first with optional Supabase

- The app is designed to be end-to-end functional without credentials.
- When Supabase env vars are present, repositories can switch to Supabase-backed implementations.
- When missing, the app falls back to:
  - Seeded in-memory event dataset
  - Cookie-backed persistence for saved events, plans, votes, and comments

This prevents blocking development, demos, and grading on external credentials.

## Server components by default

- Data-heavy routes use Server Components (`/discover`, `/events/[slug]`, `/plans/*`).
- Client Components are used only for interaction layers:
  - saving events
  - creating plans
  - voting, commenting, itinerary reorder
  - AI planner form + progressive UI

## Validation and strict typing

- Zod schemas validate URL search params and AI structured outputs.
- TypeScript is strict; APIs avoid `any` in application types.

## AI integration approach

- Provider abstraction (`mock` vs `openai-compatible`).
- Structured JSON output validated by Zod.
- Grounding enforcement: selected event slugs must exist in the provided candidate list.

## Testing strategy

- Focused unit tests for core logic:
  - event filtering/sorting
  - vote aggregation
  - AI response schema validation

## Auth session refresh (Next.js 16 Proxy)

Next.js 16 deprecated `middleware.ts` and renamed it to `proxy.ts`. We
ship a `proxy.ts` at the project root that uses `@supabase/ssr` to
refresh the Supabase session cookie on every non-static request. This
keeps server components and route handlers synchronized with the
client's auth state, and ensures `await supabase.auth.getUser()` works
reliably in both server pages and API routes.

When Supabase env vars are absent, the proxy is a pure pass-through.

## Server data helpers vs route handlers

For pages that only need read access (Plans dashboard, Plan details,
Profile), we read directly from Supabase in Server Components via
`lib/plans/server.ts` helpers. For mutations (creating plans, voting,
adding events, comments, itinerary reorder, AI generation), we use
Route Handlers under `app/api/*` so the client can mutate via
TanStack Query with predictable invalidation.

This separation avoids server-action / client-component coupling and
mirrors the same pattern the cookie-based local mode uses, so feature
code remains identical across modes.

## Type system fidelity

`PlanRecord` includes `ownerId` to match the database `owner_id`
column. The cookie-mode storage assigns `ownerId: "local"` when no
real user is present, keeping the type total and avoiding optional
fields that would have to be defensively checked everywhere.

`PlanEventRecord`, `VoteRecord`, and `CommentRecord` keep their
"slug-keyed" shape on purpose: this is the application-level identity
the UI uses, while the API routes translate between slugs and
database UUIDs at the boundary. This means UI code does not have to
know two different identifier schemes per row type.
