import { z } from "zod";

export const vibeSchema = z.enum([
  "chill",
  "active",
  "artsy",
  "foodie",
  "nightlife",
  "wellness",
  "mixed",
]);

export const aiPlanRequestSchema = z.object({
  city: z.string().min(1),
  date: z.string().min(1),
  budget: z.number().min(0),
  interests: z.array(z.string()).default([]),
  groupSize: z.number().int().min(1).max(20).default(2),
  vibe: vibeSchema.default("mixed"),
});

export type AIPlanRequest = z.infer<typeof aiPlanRequestSchema>;

export const aiItineraryBlockSchema = z.object({
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  title: z.string().min(1),
  eventSlug: z.string().nullable(),
  notes: z.string().default(""),
});

export const aiPlanResponseSchema = z.object({
  summary: z.string().min(1),
  selectedEventSlugs: z.array(z.string()).min(1),
  itinerary: z.array(aiItineraryBlockSchema).min(1),
  estimatedTotalCost: z.number().min(0),
  rationale: z.string().min(1),
  backupOptions: z.array(z.string()).default([]),
});

export type AIPlanResponse = z.infer<typeof aiPlanResponseSchema>;
