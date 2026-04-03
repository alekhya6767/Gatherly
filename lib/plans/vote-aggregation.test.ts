import { describe, expect, it } from "vitest";

import { aggregateVoteTotal, type VoteLike } from "@/lib/plans/vote-aggregation";

describe("aggregateVoteTotal", () => {
  it("sums votes for a given eventSlug", () => {
    const votes = [
      {
        eventSlug: "jazz-night",
        value: 1,
      },
      {
        eventSlug: "jazz-night",
        value: -1,
      },
      {
        eventSlug: "ramen-tasting",
        value: 1,
      },
    ] satisfies VoteLike[];

    expect(aggregateVoteTotal(votes, "jazz-night")).toBe(0);
    expect(aggregateVoteTotal(votes, "ramen-tasting")).toBe(1);
  });
});
