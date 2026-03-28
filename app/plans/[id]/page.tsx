import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteHeader } from "@/components/shared/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getPlanAggregate } from "@/lib/plans/server";
import { PlanEventsPanel } from "@/features/plans/components/plan-events-panel";
import { CommentsPanel } from "@/features/plans/components/comments-panel";

export default async function PlanDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agg = await getPlanAggregate(id);

  if (!agg) notFound();

  return (
    <div className="page-wrapper">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/plans">Back</Link>
                </Button>
                <Badge variant="secondary">Invite: {agg.plan.inviteCode}</Badge>
              </div>
              <h1 className="mt-3 truncate font-heading text-2xl font-semibold tracking-tight">
                {agg.plan.title}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {agg.plan.city ? `${agg.plan.city} • ` : ""}
                {agg.plan.planDate} • Budget ${agg.plan.budget} • {agg.plan.vibe}
              </p>
            </div>

            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Share invite code</p>
              <p className="font-mono text-sm font-semibold tracking-wider">
                {agg.plan.inviteCode}
              </p>
            </Card>
          </div>

          <PlanEventsPanel planId={agg.plan.id} />

          <CommentsPanel planId={agg.plan.id} />

          <Card className="p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">Invite someone</p>
                <p className="text-sm text-muted-foreground">
                  Share the invite code above. Or open the join page on another
                  device.
                </p>
              </div>
              <Button asChild variant="outline">
                <Link href="/plans/join">Open join page</Link>
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
