import { describe, expect, it } from "vitest";

import { filterAndSortEvents } from "@/lib/events/filter-events";
import type { EventRecord } from "@/types/event";

const base: EventRecord[] = [
  {
    id: "1",
    title: "Jazz Night",
    slug: "jazz-night",
    description: "Live jazz in a cozy room",
    category: "Music",
    venue: "Venue A",
    city: "San Jose",
    startsAt: "2026-01-10T02:00:00.000Z",
    endsAt: "2026-01-10T04:00:00.000Z",
    priceMin: 10,
    priceMax: 20,
    imageUrl: null,
    tags: ["jazz", "night"],
    latitude: null,
    longitude: null,
    source: "seed",
    externalUrl: null,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "2",
    title: "Ramen Tasting",
    slug: "ramen-tasting",
    description: "Noodles and broth",
    category: "Food & Drink",
    venue: "Venue B",
    city: "San Jose",
    startsAt: "2026-01-09T02:00:00.000Z",
    endsAt: "2026-01-09T03:00:00.000Z",
    priceMin: 15,
    priceMax: 30,
    imageUrl: null,
    tags: ["foodie"],
    latitude: null,
    longitude: null,
    source: "seed",
    externalUrl: null,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

describe("filterAndSortEvents", () => {
  it("filters by query string across title and tags", () => {
    const out = filterAndSortEvents(base, { q: "jazz", sort: "trending" });
    expect(out.map((e) => e.slug)).toEqual(["jazz-night"]);
  });

  it("sorts by date ascending", () => {
    const out = filterAndSortEvents(base, { sort: "date" });
    expect(out.map((e) => e.slug)).toEqual(["ramen-tasting", "jazz-night"]);
  });
});
