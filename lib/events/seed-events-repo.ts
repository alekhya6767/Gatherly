import type { EventsRepository } from "@/lib/events/repository";
import { filterAndSortEvents } from "@/lib/events/filter-events";
import { seededEvents } from "@/lib/events/seed-events";

export const seedEventsRepository: EventsRepository = {
  async listDiscoverEvents(params) {
    return filterAndSortEvents(seededEvents, params);
  },
  async getEventBySlug(slug) {
    return seededEvents.find((e) => e.slug === slug) ?? null;
  },
  async listRelatedEvents(event) {
    const related = seededEvents.filter(
      (e) => e.id !== event.id && (e.city === event.city || e.category === event.category),
    );

    return related.slice(0, 6);
  },
};
