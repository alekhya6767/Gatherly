import { getSupabaseEnv } from "@/lib/supabase/env";
import type { EventsRepository } from "@/lib/events/repository";
import { seedEventsRepository } from "@/lib/events/seed-events-repo";
import { supabaseEventsRepository } from "@/lib/events/supabase-events-repo";

export function getEventsRepository(): EventsRepository {
  const env = getSupabaseEnv();
  if (!env) return seedEventsRepository;
  return supabaseEventsRepository;
}
