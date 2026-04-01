import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteHeader } from "@/components/shared/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AddToPlanButton } from "@/features/discovery/components/add-to-plan-button";
import { EventCard } from "@/features/discovery/components/event-card";
import { SaveEventButton } from "@/features/discovery/components/save-event-button";
import { getEventsRepository } from "@/lib/events/get-events-repo";
import { getSupabaseEnv } from "@/lib/supabase/env";

export default async function EventDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const repo = getEventsRepository();
  const { slug } = await params;
  const event = await repo.getEventBySlug(slug);

  if (!event) notFound();

  const related = await repo.listRelatedEvents(event);
  const supabaseEnabled = Boolean(getSupabaseEnv());

  return (
    <div className="page-wrapper">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-4 py-10">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href="/discover">Back</Link>
            </Button>
            <Badge variant="secondary">{event.category}</Badge>
          </div>

          <header className="space-y-2">
            <p className="text-sm text-muted-foreground">{event.city}</p>
            <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
              {event.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              {new Date(event.startsAt).toLocaleString()} — {event.venue}
            </p>
          </header>

          <Card className="p-6">
            <div className="space-y-4">
              <p className="text-sm leading-7 text-muted-foreground">
                {event.description}
              </p>

              <div className="flex flex-wrap gap-2">
                {event.tags.map((t) => (
                  <Badge key={t} variant="outline">
                    {t}
                  </Badge>
                ))}
              </div>

              <div className="rounded-xl border bg-muted/30 p-4 text-sm">
                <div className="grid gap-2 md:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground">Price range</p>
                    <p className="font-medium">
                      {event.priceMin === 0 && event.priceMax === 0
                        ? "Free"
                        : `$${event.priceMin}–$${event.priceMax}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Source</p>
                    <p className="font-medium">
                      {supabaseEnabled ? "Supabase" : "Seeded demo data"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <SaveEventButton slug={event.slug} />
                <AddToPlanButton
                  eventSlug={event.slug}
                  eventTitle={event.title}
                  eventCity={event.city}
                />
              </div>
            </div>
          </Card>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold tracking-tight">
                Related events
              </h2>
              <Button asChild size="sm" variant="ghost">
                <Link href="/discover">Browse more</Link>
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {related.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
