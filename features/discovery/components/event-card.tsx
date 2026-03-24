import Link from "next/link";

import type { EventRecord } from "@/types/event";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SaveEventButton } from "@/features/discovery/components/save-event-button";

function formatMoneyRange(min: number, max: number) {
  if (min === 0 && max === 0) return "Free";
  if (min === max) return `$${min}`;
  return `$${min}–$${max}`;
}

export function EventCard({ event }: { event: EventRecord }) {
  return (
    <Card className="group overflow-hidden card-hover animate-fade-up glass">
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{event.city}</p>
            <Link
              href={`/events/${event.slug}`}
              className="mt-1 line-clamp-2 font-heading text-base font-semibold tracking-tight underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {event.title}
            </Link>
          </div>
          <Badge variant="secondary">{event.category}</Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">
            {new Date(event.startsAt).toLocaleString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
          <span className="text-muted-foreground">•</span>
          <span className="font-medium">{formatMoneyRange(event.priceMin, event.priceMax)}</span>
        </div>

        <p className="line-clamp-2 text-sm text-muted-foreground">
          {event.description}
        </p>

        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {event.tags.slice(0, 3).map((t) => (
              <Badge key={t} variant="outline">
                {t}
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <SaveEventButton slug={event.slug} />
            <Button asChild size="sm" variant="outline">
              <Link href={`/events/${event.slug}`}>Details</Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
