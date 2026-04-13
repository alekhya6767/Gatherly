export type EventCategory =
  | "Food & Drink"
  | "Music"
  | "Arts"
  | "Nightlife"
  | "Outdoors"
  | "Wellness"
  | "Tech"
  | "Community";

export type EventRecord = {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: EventCategory;
  venue: string;
  city: string;
  startsAt: string;
  endsAt: string;
  priceMin: number;
  priceMax: number;
  imageUrl: string | null;
  tags: string[];
  latitude: number | null;
  longitude: number | null;
  source: "seed" | "supabase";
  externalUrl: string | null;
  createdAt: string;
};
