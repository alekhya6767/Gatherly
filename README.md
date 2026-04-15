# Gatherly

AI-powered event discovery and collaborative social planning, built with
Next.js App Router, React 19, TypeScript, Tailwind v4, shadcn/ui,
TanStack Query, Zod, and Supabase.

CMPE 280 final project. Runs end-to-end with **zero credentials**
(seeded in-memory data + cookies), and upgrades transparently to a real
multi-user app once Supabase credentials are configured.

## Features

- **Auth** — sign-up, sign-in, sign-out, session persistence (Supabase). Profile row auto-created on sign-up.
- **Discover** — search, filter by city/category, sort by trending / date / price.
- **Event details** — slug-based page, save/bookmark, add to plan.
- **Saved events** — per-user (Supabase) or per-browser (cookie fallback).
- **Plans dashboard** — list owned + joined plans.
- **Plan details** — add events from saved list, vote up/down (separate counts), reorder itinerary, comments, invite code.
- **Join via invite code** — share a code; friends join at `/plans/join`.
- **AI planner** — structured generation grounded in the event catalog via Groq/OpenAI-compatible API, with deterministic mock fallback. Save result directly into a plan.
- **Profile page** — display name, email, saved events, created plans, joined plan count.
- **Animated mesh UI** — particle network canvas background, glassmorphism cards, dark/light mode.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js App Router (`proxy.ts` = middleware) |
| UI | React 19, Tailwind v4, shadcn/ui, Lucide icons |
| State | TanStack Query (client), React `useTransition` |
| Validation | Zod (URL params, AI output schema) |
| Backend | Supabase Postgres + RLS + Auth (`@supabase/ssr`) |
| AI | OpenAI-compatible API (tested with Groq), mock fallback |
| Tests | Vitest |

## Quick start (zero credentials)

```bash
npm install
npm run dev
# open http://localhost:3000
```

In this mode events come from `lib/events/seed-events.ts` (~42 events),
state lives in HTTP-only cookies, and the AI planner uses a mock provider.

## Full setup (Supabase + AI)

```bash
cp .env.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Optional AI (Groq or OpenAI-compatible):

```
OPENAI_API_KEY=gsk_...
OPENAI_BASE_URL=https://api.groq.com/openai/v1
OPENAI_MODEL=llama3-70b-8192
```

If `OPENAI_API_KEY` is unset the AI planner automatically uses the mock.

### Database setup

1. Run `supabase/migrations/0001_init.sql` in the Supabase SQL editor.
2. Run `supabase/seed.sql` to populate events.
3. Run the following function (required for invite-code join to bypass RLS):

```sql
create or replace function find_plan_by_invite_code(p_invite_code text)
returns setof plans
language sql
security definer
set search_path = public
as $$
  select * from plans
  where invite_code = p_invite_code
    and visibility = 'link'
  limit 1;
$$;
```

4. In **Auth → Email**: disable "Confirm email" for frictionless demo sign-up.

```bash
npm run dev
# sign up at /auth/sign-up → lands on /plans
```

## Project structure

```
app/                Route pages (server-first) + API route handlers
  api/              JSON endpoints: plans, events, votes, comments, AI
  auth/             Sign-in, sign-up, sign-out
  discover/         Event discovery (server) + loading/error boundaries
  events/[slug]/    Event detail page
  plans/            Dashboard, detail ([id]), join page
  ai-planner/       AI planner page
  profile/          User profile (server)
components/
  ui/               shadcn/ui primitives
  shared/           Header, footer, theme toggle, mesh background, user menu
features/
  discovery/        EventCard, SaveEventButton, AddToPlanButton, DiscoverFilters
  plans/            CreatePlanDialog, JoinPlanForm, PlanEventsPanel, CommentsPanel
  ai-planner/       AIPlannerPanel
lib/
  ai/               Provider interface + OpenAI/mock implementations + Zod schemas
  events/           Repository pattern (seed + Supabase), filtering, lookup
  plans/            Cookie storage, server helpers (getPlansForCurrentUser, getPlanAggregate)
  saved-events/     Cookie helpers
  supabase/         Browser + server clients, env detection
  validations/      Zod schemas for URL search params
types/              Shared TypeScript types (EventRecord, PlanRecord, VoteRecord, …)
supabase/           migrations/0001_init.sql + seed.sql
proxy.ts            Next.js middleware — refreshes Supabase session cookie
```

## Quality

```bash
npm run lint        # ESLint (0 errors)
npm run typecheck   # tsc --noEmit strict (0 errors)
npm run test        # Vitest unit tests
npm run build       # Next.js production build (0 errors)
```

## Docs

- [`docs/engineering-decisions.md`](docs/engineering-decisions.md) — architecture rationale
- [`docs/rubric-mapping.md`](docs/rubric-mapping.md) — feature → grading criteria map
- [`docs/known-limitations.md`](docs/known-limitations.md) — explicit trade-offs

## Team contribution split

This project is designed to be submitted by a 3-member team with clear ownership boundaries.

- **Vijaya Sharavan Reddy Baddam — Auth + Supabase + project shell**
  - Authentication routes and session setup
  - Supabase client/env wiring and database bootstrap
  - Global app shell/provider integration
- **Jayanth Sai Yarlagadda — Discovery + Events**
  - Event discovery pages, filtering, lookup APIs
  - Event details and saved-events flow
  - Event repository and validation utilities
- **Divyasri Lakshmi Alekhya Nakka — Plans + AI Planner**
  - Plans routes/pages and collaboration APIs (join, votes, comments, itinerary)
  - AI planner page, panel, and AI plan-generation API route
  - Plan/AI libraries (`lib/plans`, `lib/ai`) and shared plan types

### Member 3 commit timeline

- 2026-03-28: plans pages
- 2026-03-29: AI planner page route
- 2026-03-30: plans API routes
- 2026-03-31: AI plan API route
- 2026-04-01: plans feature components
- 2026-04-02: AI planner feature component
- 2026-04-03: plan libraries and types
- 2026-04-04: AI provider and schema libraries
