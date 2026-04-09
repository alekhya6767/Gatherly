import type { EventRecord } from "@/types/event";

function iso(d: Date) {
  return d.toISOString();
}

const now = new Date();
const base = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 18, 0, 0));

export const seededEvents: EventRecord[] = [
  {
    id: "evt_001",
    title: "Ramen Passport Night",
    slug: "ramen-passport-night",
    description:
      "Taste three rotating broths, vote on your favorite, and collect stamps toward a free bowl.",
    category: "Food & Drink",
    venue: "Kumo Ramen Lab",
    city: "San Jose",
    startsAt: iso(new Date(base.getTime() + 1 * 24 * 60 * 60 * 1000)),
    endsAt: iso(new Date(base.getTime() + 1 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000)),
    priceMin: 18,
    priceMax: 32,
    imageUrl: null,
    tags: ["noodles", "tasting", "group-friendly"],
    latitude: null,
    longitude: null,
    source: "seed",
    externalUrl: null,
    createdAt: iso(now),
  },
  {
    id: "evt_002",
    title: "Downtown Jazz Set (Late)",
    slug: "downtown-jazz-set-late",
    description:
      "A cozy late-night quartet with table-side mocktails and a low-lit lounge vibe.",
    category: "Music",
    venue: "Blue Note Corner",
    city: "San Jose",
    startsAt: iso(new Date(base.getTime() + 1 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000)),
    endsAt: iso(new Date(base.getTime() + 1 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000)),
    priceMin: 15,
    priceMax: 25,
    imageUrl: null,
    tags: ["jazz", "night", "date"],
    latitude: null,
    longitude: null,
    source: "seed",
    externalUrl: null,
    createdAt: iso(now),
  },
  {
    id: "evt_003",
    title: "Modern Art After Hours",
    slug: "modern-art-after-hours",
    description:
      "Gallery access with a short curator talk and a quiet soundtrack. Great for small groups.",
    category: "Arts",
    venue: "South Bay Modern",
    city: "San Jose",
    startsAt: iso(new Date(base.getTime() + 2 * 24 * 60 * 60 * 1000)),
    endsAt: iso(new Date(base.getTime() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000)),
    priceMin: 10,
    priceMax: 18,
    imageUrl: null,
    tags: ["museum", "indoor", "artsy"],
    latitude: null,
    longitude: null,
    source: "seed",
    externalUrl: null,
    createdAt: iso(now),
  },
  {
    id: "evt_004",
    title: "Sunrise Coastal Hike",
    slug: "sunrise-coastal-hike",
    description:
      "A guided easy-to-moderate hike with optional coffee stop afterwards.",
    category: "Outdoors",
    venue: "Coastal Trailhead",
    city: "Santa Cruz",
    startsAt: iso(new Date(base.getTime() + 3 * 24 * 60 * 60 * 1000 - 10 * 60 * 60 * 1000)),
    endsAt: iso(new Date(base.getTime() + 3 * 24 * 60 * 60 * 1000 - 7 * 60 * 60 * 1000)),
    priceMin: 0,
    priceMax: 0,
    imageUrl: null,
    tags: ["hike", "morning", "scenic"],
    latitude: null,
    longitude: null,
    source: "seed",
    externalUrl: null,
    createdAt: iso(now),
  },
];

// Expand to ~40 events with a deterministic generator for variety.
const cities = ["San Jose", "San Francisco", "Oakland", "Palo Alto", "Santa Cruz"] as const;
const categories = [
  "Food & Drink",
  "Music",
  "Arts",
  "Nightlife",
  "Outdoors",
  "Wellness",
  "Tech",
  "Community",
] as const;

const tagPool = [
  "indoor",
  "outdoor",
  "family",
  "date",
  "group-friendly",
  "free",
  "late",
  "morning",
  "chill",
  "active",
  "foodie",
  "arsty",
  "night",
];

function pick<T>(arr: readonly T[], idx: number) {
  return arr[idx % arr.length];
}

function makeId(n: number) {
  return `evt_${String(n).padStart(3, "0")}`;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

for (let i = 5; i <= 42; i += 1) {
  const city = pick(cities, i);
  const category = pick(categories, i);

  const start = new Date(base.getTime() + (i % 18) * 24 * 60 * 60 * 1000 + (i % 5) * 60 * 60 * 1000);
  const end = new Date(start.getTime() + (90 + (i % 4) * 30) * 60 * 1000);

  const priceBase = (i % 7) * 7;
  const priceMin = category === "Outdoors" || category === "Community" ? 0 : priceBase;
  const priceMax = category === "Outdoors" || category === "Community" ? 0 : priceBase + 18;

  const title = `${category} Pick #${i} in ${city}`;

  seededEvents.push({
    id: makeId(i),
    title,
    slug: slugify(title),
    description:
      "A curated demo event with realistic fields for filtering, saving, and planning.",
    category,
    venue: `${city} Venue ${i % 9}`,
    city,
    startsAt: iso(start),
    endsAt: iso(end),
    priceMin,
    priceMax,
    imageUrl: null,
    tags: [pick(tagPool, i), pick(tagPool, i + 3), pick(tagPool, i + 6)],
    latitude: null,
    longitude: null,
    source: "seed",
    externalUrl: null,
    createdAt: iso(now),
  });
}
