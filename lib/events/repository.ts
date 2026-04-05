import type { DiscoverSearchParams } from "@/lib/validations/discover";
import type { EventRecord } from "@/types/event";

export type EventsRepository = {
  listDiscoverEvents: (params: DiscoverSearchParams) => Promise<EventRecord[]>;
  getEventBySlug: (slug: string) => Promise<EventRecord | null>;
  listRelatedEvents: (event: EventRecord) => Promise<EventRecord[]>;
};
