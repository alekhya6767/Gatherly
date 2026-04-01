"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { aggregateVoteCounts } from "@/lib/plans/vote-aggregation";

async function fetchPlan(id: string) {
  const res = await fetch(`/api/plans/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load plan");
  const data = (await res.json()) as {
    ok: true;
    aggregate: {
      plan: { id: string; inviteCode: string };
      events: { eventSlug: string; sortOrder: number }[];
      votes: { eventSlug: string; value: 1 | -1 }[];
      comments: unknown[];
    };
  };
  return data.aggregate;
}

async function addEvent(planId: string, eventSlug: string) {
  const res = await fetch(`/api/plans/${planId}/events`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ eventSlug }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Failed to add");
  }
}

async function removeEvent(planId: string, eventSlug: string) {
  const res = await fetch(`/api/plans/${planId}/events`, {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ eventSlug }),
  });
  if (!res.ok) throw new Error("Failed to remove");
}

async function vote(planId: string, eventSlug: string, value: 1 | -1) {
  const res = await fetch(`/api/plans/${planId}/votes`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ eventSlug, value }),
  });
  if (!res.ok) throw new Error("Failed to vote");
}

async function reorder(planId: string, eventSlug: string, direction: "up" | "down") {
  const res = await fetch(`/api/plans/${planId}/itinerary`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ eventSlug, direction }),
  });
  if (!res.ok) throw new Error("Failed to reorder");
}

async function fetchSaved() {
  const res = await fetch("/api/saved-events", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load saved");
  return (await res.json()) as { slugs: string[] };
}

async function fetchEventTitles(slugs: string[]): Promise<Record<string, string>> {
  if (slugs.length === 0) return {};
  const params = new URLSearchParams();
  for (const s of slugs) params.append("slug", s);
  const res = await fetch(`/api/events/lookup?${params.toString()}`, { cache: "no-store" });
  if (!res.ok) return {};
  const data = (await res.json()) as { events: { slug: string; title: string }[] };
  return Object.fromEntries(data.events.map((e) => [e.slug, e.title]));
}

export function PlanEventsPanel({ planId }: { planId: string }) {
  const qc = useQueryClient();

  const { data: agg, isLoading } = useQuery({
    queryKey: ["plan", planId],
    queryFn: () => fetchPlan(planId),
  });

  const { data: saved } = useQuery({
    queryKey: ["saved-events"],
    queryFn: fetchSaved,
  });

  const allSlugs = React.useMemo(() => {
    const set = new Set<string>();
    (agg?.events ?? []).forEach((e) => set.add(e.eventSlug));
    (saved?.slugs ?? []).forEach((s) => set.add(s));
    return Array.from(set);
  }, [agg, saved]);

  const { data: titles } = useQuery({
    queryKey: ["event-titles", allSlugs.slice().sort().join(",")],
    queryFn: () => fetchEventTitles(allSlugs),
    enabled: allSlugs.length > 0,
  });

  const titleFor = (slug: string) => titles?.[slug] ?? slug;

  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  if (isLoading || !agg) {
    return (
      <Card className="p-6">
        <div className="space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-24 w-full" />
        </div>
      </Card>
    );
  }

  const voteCounts = (slug: string) => aggregateVoteCounts(agg.votes, slug);

  const savedSlugs = saved?.slugs ?? [];
  const alreadyInPlan = new Set(agg.events.map((e) => e.eventSlug));
  const addable = savedSlugs.filter((s) => !alreadyInPlan.has(s)).slice(0, 8);

  return (
    <div className="grid gap-4">
      <Card className="p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Options</p>
            <p className="text-sm text-muted-foreground">
              Add from saved events, vote, and build a simple itinerary order.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Invite: {agg.plan.inviteCode}</Badge>
            <Button asChild size="sm" variant="outline">
              <Link href="/discover">Discover</Link>
            </Button>
          </div>
        </div>

        {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}

        {addable.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {addable.map((slug) => (
              <Button
                key={slug}
                type="button"
                size="sm"
                variant="secondary"
                disabled={pending}
                onClick={() => {
                  setError(null);
                  startTransition(async () => {
                    try {
                      await addEvent(planId, slug);
                      await qc.invalidateQueries({ queryKey: ["plan", planId] });
                    } catch (e) {
                      setError(e instanceof Error ? e.message : "Failed");
                    }
                  });
                }}
              >
                + {titleFor(slug)}
              </Button>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Save a few events from Discover to add them here.
          </p>
        )}
      </Card>

      {agg.events.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm font-medium">No events in this plan yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add saved events above. Then vote to decide what makes the cut.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {agg.events
            .slice()
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((e, index) => (
              <Card key={e.eventSlug} className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="mt-1 flex flex-col items-center">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full border bg-primary/10 text-xs font-semibold">
                        {index + 1}
                      </div>
                      {index !== agg.events.length - 1 ? (
                        <div className="mt-2 h-10 w-px bg-border" aria-hidden="true" />
                      ) : null}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{titleFor(e.eventSlug)}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        👍 {voteCounts(e.eventSlug).up} · 👎 {voteCounts(e.eventSlug).down}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      aria-label={`Vote up ${titleFor(e.eventSlug)}`}
                      onClick={() => {
                        setError(null);
                        startTransition(async () => {
                          try {
                            await vote(planId, e.eventSlug, 1);
                            await qc.invalidateQueries({ queryKey: ["plan", planId] });
                          } catch (err) {
                            setError(err instanceof Error ? err.message : "Failed");
                          }
                        });
                      }}
                    >
                      +1
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      aria-label={`Vote down ${titleFor(e.eventSlug)}`}
                      onClick={() => {
                        setError(null);
                        startTransition(async () => {
                          try {
                            await vote(planId, e.eventSlug, -1);
                            await qc.invalidateQueries({ queryKey: ["plan", planId] });
                          } catch (err) {
                            setError(err instanceof Error ? err.message : "Failed");
                          }
                        });
                      }}
                    >
                      -1
                    </Button>

                    <Button asChild type="button" size="sm" variant="secondary">
                      <Link href={`/events/${e.eventSlug}`}>View</Link>
                    </Button>

                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={pending || index === 0}
                      onClick={() => {
                        setError(null);
                        startTransition(async () => {
                          try {
                            await reorder(planId, e.eventSlug, "up");
                            await qc.invalidateQueries({ queryKey: ["plan", planId] });
                          } catch (err) {
                            setError(err instanceof Error ? err.message : "Failed");
                          }
                        });
                      }}
                      aria-label="Move up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={pending || index === agg.events.length - 1}
                      onClick={() => {
                        setError(null);
                        startTransition(async () => {
                          try {
                            await reorder(planId, e.eventSlug, "down");
                            await qc.invalidateQueries({ queryKey: ["plan", planId] });
                          } catch (err) {
                            setError(err instanceof Error ? err.message : "Failed");
                          }
                        });
                      }}
                      aria-label="Move down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>

                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={pending}
                      onClick={() => {
                        setError(null);
                        startTransition(async () => {
                          try {
                            await removeEvent(planId, e.eventSlug);
                            await qc.invalidateQueries({ queryKey: ["plan", planId] });
                          } catch (err) {
                            setError(err instanceof Error ? err.message : "Failed");
                          }
                        });
                      }}
                      aria-label="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
