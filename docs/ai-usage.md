# AI Tool Usage Reflection

## How AI Helped

AI accelerated boilerplate work: generating shadcn/ui component structures, API route stubs with error handling, and Zod validation schemas. It helped debug TypeScript errors—especially TanStack Query generics—and suggested Tailwind v4 migration patterns. For documentation, AI structured the README and presentation slide content.

## Where AI Hurt

AI sometimes over-engineered solutions, suggesting Redux when `useState` sufficed. It produced generic error messages that we replaced with specific context. Supabase join suggestions failed due to missing foreign keys; we refactored to separate profile lookups. A CSS `mix-blend-mode` suggestion broke light mode visibility, so we used a white pill container instead.

## Verification

We read every AI suggestion before applying it, ensuring alignment with our patterns. After changes, we ran `npm run lint`, `typecheck`, and `build`. We cross-checked Supabase queries, Tailwind v4 syntax, and React Query patterns against official docs.

## Avoiding Over-Reliance

Architecture decisions were human-driven: cookie fallback demo mode, Groq API choice, and glassmorphism design were team decisions. AI handled implementation details, not system architecture. Each team member implemented their segment independently; AI was for syntax help, not feature implementation.

## Ethical Use

We did not use AI to generate or backdate git commits. All commits reflect actual work. AI assisted but did not replace judgment—we reviewed and rejected suggestions that didn't fit our needs. This document honestly documents both benefits and limitations.

## Screenshots

![TypeScript error fix](./screenshots/ts-error-fix.png)
*Figure 1: AI-assisted TypeScript error fix in VS Code*

![Component boilerplate](./screenshots/component-boilerplate.png)
*Figure 2: AI-generated component structure before manual customization*

## Summary

AI accelerated boilerplate and debugging, but we maintained quality by understanding every suggestion, testing after changes, making architectural decisions ourselves, and rejecting AI outputs that didn't fit. AI was a force multiplier, not a replacement for engineering judgment.
