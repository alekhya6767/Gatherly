# Rubric mapping

## Technical architecture & code quality

- Clean separation:
  - `app/` routes and layouts
  - `features/` UI + interaction logic
  - `lib/` domain logic, repositories, validation, integrations
  - `types/` shared TypeScript types
- Strict TypeScript + Zod validation for user inputs and AI outputs.
- Local-first fallback ensures the app works end-to-end without credentials.

## UI/UX & accessibility

- Loading/empty/error/success states are implemented for core flows.
- Keyboard-accessible controls using shadcn/ui primitives.
- Visible focus styles via shadcn/tailwind defaults.
- `aria-live` regions for AI planner progressive feedback.

## Feature completeness

- Event discovery:
  - search/filter/sort over seeded catalog
  - event details
  - save/bookmark
- Plans:
  - create plan
  - add/remove events
  - voting
  - comments
  - itinerary reorder (move up/down)
  - invite/join flow (local demo mode)
- AI planner:
  - structured plan generation grounded in catalog
  - mock fallback when keys are missing
  - save-to-plan

## Performance

- Server components for read-heavy pages.
- Client components are scoped to interactive parts.
- Minimal state: URL params + TanStack Query for server state.

## Meaningful AI integration

- AI output is structured and validated.
- Grounded selection: only catalog events can be selected.
- Output drives real application state (save into plans and itinerary).
