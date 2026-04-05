import {
  discoverSearchParamsSchema,
  type DiscoverSearchParams,
} from "@/lib/validations/discover";
import { getEventsRepository } from "@/lib/events/get-events-repo";

export async function getDiscoverEvents(raw: unknown) {
  const parsed = discoverSearchParamsSchema.safeParse(raw);
  const params: DiscoverSearchParams = parsed.success
    ? parsed.data
    : discoverSearchParamsSchema.parse({});

  const repo = getEventsRepository();

  const events = await repo.listDiscoverEvents(params);

  return { events, params };
}
