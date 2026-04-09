import type { DiscoverSearchParams } from "@/lib/validations/discover";
import type { EventRecord } from "@/types/event";

function includesCI(haystack: string, needle: string) {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function parseIso(s: string) {
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : new Date(t);
}

export function filterAndSortEvents(
  events: readonly EventRecord[],
  params: DiscoverSearchParams,
) {
  const q = params.q?.trim();
  const city = params.city?.trim();
  const category = params.category?.trim();

  const start = params.start ? parseIso(params.start) : null;
  const end = params.end ? parseIso(params.end) : null;

  const minPrice = params.minPrice;
  const maxPrice = params.maxPrice;

  const filtered = events.filter((e) => {
    if (q && !includesCI(`${e.title} ${e.description} ${e.venue} ${e.city} ${e.tags.join(" ")}`, q)) {
      return false;
    }

    if (city && e.city !== city) return false;
    if (category && e.category !== category) return false;

    const startsAt = parseIso(e.startsAt);
    if (!startsAt) return false;

    if (start && startsAt < start) return false;
    if (end && startsAt > end) return false;

    if (typeof minPrice === "number" && e.priceMax < minPrice) return false;
    if (typeof maxPrice === "number" && e.priceMin > maxPrice) return false;

    return true;
  });

  const sort = params.sort ?? "trending";

  if (sort === "date") {
    return [...filtered].sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  }

  if (sort === "price") {
    return [...filtered].sort((a, b) => a.priceMin - b.priceMin);
  }

  // trending: stable-ish heuristic for demo
  return [...filtered].sort((a, b) => {
    const aScore = a.tags.length * 2 + (a.priceMin === 0 ? 1 : 0);
    const bScore = b.tags.length * 2 + (b.priceMin === 0 ? 1 : 0);
    return bScore - aScore;
  });
}
