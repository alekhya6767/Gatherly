import { z } from "zod";

import type {
  CommentRecord,
  PlanAggregate,
  PlanEventRecord,
  PlanRecord,
  PlanVisibility,
  VoteRecord,
} from "@/types/plan";

export const PLANS_COOKIE_NAME = "pt_plans";

const visibilitySchema = z.enum(["private", "link"]) satisfies z.ZodType<PlanVisibility>;

const planSchema = z.object({
  id: z.string(),
  ownerId: z.string().default("local"),
  title: z.string(),
  description: z.string(),
  city: z.string(),
  planDate: z.string(),
  budget: z.number(),
  vibe: z.string(),
  visibility: visibilitySchema,
  inviteCode: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
}) satisfies z.ZodType<PlanRecord>;

const planEventSchema = z.object({
  id: z.string(),
  planId: z.string(),
  eventSlug: z.string(),
  note: z.string(),
  startsAt: z.string().nullable(),
  endsAt: z.string().nullable(),
  sortOrder: z.number(),
  createdAt: z.string(),
}) satisfies z.ZodType<PlanEventRecord>;

const voteSchema = z.object({
  id: z.string(),
  planId: z.string(),
  eventSlug: z.string(),
  voterKey: z.string(),
  value: z.union([z.literal(1), z.literal(-1)]),
  createdAt: z.string(),
}) satisfies z.ZodType<VoteRecord>;

const commentSchema = z.object({
  id: z.string(),
  planId: z.string(),
  authorKey: z.string(),
  body: z.string(),
  createdAt: z.string(),
}) satisfies z.ZodType<CommentRecord>;

const plansCookieSchema = z.object({
  plans: z.array(planSchema).default([]),
  events: z.array(planEventSchema).default([]),
  votes: z.array(voteSchema).default([]),
  comments: z.array(commentSchema).default([]),
});

export type PlansCookie = z.infer<typeof plansCookieSchema>;

export function parsePlansCookie(raw: string | undefined): PlansCookie {
  if (!raw) return { plans: [], events: [], votes: [], comments: [] };

  try {
    const json = JSON.parse(raw) as unknown;
    const parsed = plansCookieSchema.safeParse(json);
    if (!parsed.success) return { plans: [], events: [], votes: [], comments: [] };
    return parsed.data;
  } catch {
    return { plans: [], events: [], votes: [], comments: [] };
  }
}

export function serializePlansCookie(cookie: PlansCookie) {
  // keep reasonably small
  const maxPlans = 30;
  const plans = cookie.plans.slice(0, maxPlans);
  const planIds = new Set(plans.map((p) => p.id));

  return JSON.stringify({
    plans,
    events: cookie.events.filter((e) => planIds.has(e.planId)).slice(0, 500),
    votes: cookie.votes.filter((v) => planIds.has(v.planId)).slice(0, 2000),
    comments: cookie.comments.filter((c) => planIds.has(c.planId)).slice(0, 1000),
  });
}

export function toPlanAggregate(cookie: PlansCookie, planId: string): PlanAggregate | null {
  const plan = cookie.plans.find((p) => p.id === planId);
  if (!plan) return null;

  return {
    plan,
    events: cookie.events
      .filter((e) => e.planId === planId)
      .sort((a, b) => a.sortOrder - b.sortOrder),
    votes: cookie.votes.filter((v) => v.planId === planId),
    comments: cookie.comments
      .filter((c) => c.planId === planId)
      .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)),
  };
}
