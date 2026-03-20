import Link from "next/link";

import { SiteHeader } from "@/components/shared/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DiscoverFilters } from "@/features/discovery/components/discover-filters";
import { EventCard } from "@/features/discovery/components/event-card";
import { getDiscoverEvents } from "@/lib/events/get-events";
import { getSupabaseEnv } from "@/lib/supabase/env";

function buildQueryString(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v && v.trim().length > 0) sp.set(k, v);
  }
  const s = sp.toString();
  return s.length ? `?${s}` : "";
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const plainSearchParams = Object.fromEntries(
    Object.entries(resolvedSearchParams),
  ) as Record<string, string | string[] | undefined>;

  const { events, params } = await getDiscoverEvents(plainSearchParams);
  const supabaseEnabled = Boolean(getSupabaseEnv());

  const q = params.q ?? "";
  const city = params.city ?? "all";
  const category = params.category ?? "all";
  const sort = params.sort ?? "trending";

  return (
    <div className="min-h-full">
      <SiteHeader />
      <main className="relative mx-auto w-full max-w-6xl px-4 py-10 animate-fade-in">
        <div className="flex flex-col gap-6">
          <header className="flex flex-col gap-3 animate-fade-up">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-2xl font-semibold tracking-tight gradient-text">
                  Discover
                </h1>
                <Badge variant="secondary">
                  {supabaseEnabled ? "Supabase data" : "Seeded demo data"}
                </Badge>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/plans">Plans</Link>
              </Button>
            </div>
            <p className="max-w-prose text-sm text-muted-foreground">
              A curated demo catalog for planning. Filter by city/category, then
              open an event to see details.
            </p>
          </header>

          <div className="sticky top-16 z-30 rounded-2xl glass p-4 animate-fade-up animate-delay-100">
            <DiscoverFilters
              initialQ={q}
              initialCity={city}
              initialCategory={category}
              initialSort={sort}
            />
          </div>

          {events.length === 0 ? (
            <Card className="p-10">
              <div className="space-y-2">
                <p className="text-sm font-medium">No results</p>
                <p className="text-sm text-muted-foreground">
                  Try searching for a broader term (like “music” or “food”), or
                  reset filters.
                </p>
                <div className="pt-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/discover">Reset filters</Link>
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-3 animate-fade-up animate-delay-200">
              {events.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            Showing {events.length} event{events.length === 1 ? "" : "s"}. You can
            share your current search with this link:{" "}
            <Link
              className="underline underline-offset-4"
              href={`/discover${buildQueryString({
                q: q || undefined,
                city: city === "all" ? undefined : city,
                category: category === "all" ? undefined : category,
                sort: sort || undefined,
              })}`}
            >
              Copyable URL
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
