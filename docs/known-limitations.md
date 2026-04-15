# Known limitations

This document tracks decisions, trade-offs, and intentional gaps in the
PlanTogether final project, so reviewers and graders can clearly
distinguish "missing feature" from "deliberate scope choice".

## Auth

- Email/password only. No magic-link or OAuth providers.
- Sign-up assumes Supabase email confirmation is **disabled** in your
  project settings (so the `auth.signUp` response includes a `user`
  immediately and we can create the corresponding `profiles` row in the
  same request). If you have email confirmation enabled, the profile row
  is still created on the first authenticated request via the existing
  insert-own RLS policy.
- Profile auto-creation happens in the sign-up route handler. There is
  no DB trigger; this keeps the SQL migration simple and avoids needing
  Supabase service-role keys.

## Local demo mode (no Supabase)

- All collaborative state (plans, votes, comments, itinerary order)
  lives in cookies. This means:
  - Plans are visible only in the browser that created them.
  - Invite codes only resolve to plans created in the same browser
    (since cookies don't cross devices).
  - Voting "user identity" is a randomly issued cookie key (`pt_voter`),
    not a real account.
- This is intentional so the app demos end-to-end with zero credentials,
  but it is not a substitute for the real multi-user flow. Configure
  Supabase to test true collaboration.

## Events data

- The event catalog is a curated demo dataset (~33 events seeded into
  Supabase, ~42 generated for the in-memory seed). It is not connected
  to a real ticketing or events provider. The `EventsRepository`
  abstraction (`lib/events/repository.ts`) is intentionally provider-
  agnostic so a future real provider can be plugged in without changing
  any UI code.

## AI planner

- The OpenAI provider uses the chat-completions API with
  `temperature: 0.2` and validates the JSON response against a strict
  Zod schema. If the model returns events not in the candidate list,
  the request fails fast with a "not grounded" error.
- The mock provider is fully deterministic and operates only on city +
  vibe + budget, with a small slug-based nudge for variety.
- AI generations are **not** persisted to the `ai_generations` table by
  default; the spec table exists in the migration but writes are deferred
  to keep the demo path simple. Saving the AI plan into a real `plans`
  row + `plan_events` is fully supported via the "Save to plan" button.

## RLS

- Plans visibility is `private` or `link`. There is no `public` mode.
- A user can self-join only plans whose `visibility = 'link'`. Private
  plans require the owner to add the member directly (RLS policy:
  `plan_members_insert_owner`).
- Comments and votes are readable by any plan member or owner; insert
  is restricted to `auth.uid() = user_id`.

## UI / UX

- The Discover page filter row uses a sticky bar with native `<form
  method="get">` submission. We deliberately avoid client-side
  filtering to keep URLs shareable and Server Components fast.
- Itinerary reordering is move-up / move-down (no drag-and-drop). This
  keeps the implementation accessible by default and avoids pulling in
  a drag-and-drop dependency.
- Avatars are text initials, not uploaded images. Uploading would
  require Supabase Storage configuration which is out of scope for the
  course final.

## Performance

- The Discover server component does not paginate; it limits to 60 rows.
  For the demo dataset this is fine; if connecting a larger source,
  pagination should be added.
- Event titles for plan items are looked up via a small JSON endpoint
  (`/api/events/lookup`) on the client. We accept the extra round-trip
  in exchange for keeping the existing per-plan storage shape unchanged.

## Testing

- Unit tests cover the highest-leverage pure logic: filtering, vote
  aggregation, and AI response schema validation. We did not add an
  end-to-end browser test; that is left as a future improvement.
