import { describe, expect, it } from "vitest";

import { aiPlanResponseSchema } from "@/lib/ai/schemas";

describe("aiPlanResponseSchema", () => {
  it("accepts valid structured output", () => {
    const parsed = aiPlanResponseSchema.safeParse({
      summary: "A fun night out",
      selectedEventSlugs: ["jazz-night"],
      itinerary: [
        {
          startTime: "18:00",
          endTime: "20:00",
          title: "Jazz",
          eventSlug: "jazz-night",
          notes: "Arrive early",
        },
      ],
      estimatedTotalCost: 120,
      rationale: "Matches vibe",
      backupOptions: ["ramen-tasting"],
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects missing required fields", () => {
    const parsed = aiPlanResponseSchema.safeParse({
      selectedEventSlugs: [],
    });
    expect(parsed.success).toBe(false);
  });
});
