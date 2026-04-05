import type { EventsRepository } from "@/lib/events/repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DiscoverSearchParams } from "@/lib/validations/discover";
import type { EventRecord } from "@/types/event";

type EventsRow = {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  venue: string;
  city: string;
  starts_at: string;
  ends_at: string;
  price_min: number;
  price_max: number;
  image_url: string | null;
  tags: string[];
  latitude: number | null;
  longitude: number | null;
  source: string;
  external_url: string | null;
  created_at: string;
};

function mapRow(row: EventsRow): EventRecord {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    category: row.category as EventRecord["category"],
    venue: row.venue,
    city: row.city,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    priceMin: row.price_min,
    priceMax: row.price_max,
    imageUrl: row.image_url,
    tags: row.tags,
    latitude: row.latitude,
    longitude: row.longitude,
    source: "supabase",
    externalUrl: row.external_url,
    createdAt: row.created_at,
  };
}

export const supabaseEventsRepository: EventsRepository = {
  async listDiscoverEvents(params: DiscoverSearchParams) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return [];

    let query = supabase.from("events").select("*");

    if (params.city) query = query.eq("city", params.city);
    if (params.category) query = query.eq("category", params.category);

    if (params.start) query = query.gte("starts_at", params.start);
    if (params.end) query = query.lte("starts_at", params.end);

    if (typeof params.minPrice === "number") query = query.gte("price_max", params.minPrice);
    if (typeof params.maxPrice === "number") query = query.lte("price_min", params.maxPrice);

    if (params.q) {
      // Basic full-text-ish search across title/venue/city/tags.
      query = query.or(
        [
          `title.ilike.%${params.q}%`,
          `description.ilike.%${params.q}%`,
          `venue.ilike.%${params.q}%`,
          `city.ilike.%${params.q}%`,
        ].join(","),
      );
    }

    if (params.sort === "date") query = query.order("starts_at", { ascending: true });
    else if (params.sort === "price") query = query.order("price_min", { ascending: true });
    else query = query.order("starts_at", { ascending: true });

    const { data, error } = await query.limit(60);

    if (error) throw new Error(error.message);
    if (!data) return [];

    return (data as EventsRow[]).map((r) => mapRow(r));
  },

  async getEventBySlug(slug: string) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;

    return mapRow(data as EventsRow);
  },

  async listRelatedEvents(event: EventRecord) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .neq("id", event.id)
      .or(`city.eq.${event.city},category.eq.${event.category}`)
      .order("starts_at", { ascending: true })
      .limit(6);

    if (error) throw new Error(error.message);
    if (!data) return [];

    return (data as EventsRow[]).map((r) => mapRow(r));
  },
};
