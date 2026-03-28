import Link from "next/link";

import { SiteHeader } from "@/components/shared/site-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CreatePlanDialog } from "@/features/plans/components/create-plan-dialog";
import { getPlansForCurrentUser } from "@/lib/plans/server";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function PlansPage() {
  const supabaseEnabled = Boolean(getSupabaseEnv());

  // If Supabase is configured, require auth.
  if (supabaseEnabled) {
    const supabase = await createSupabaseServerClient();
    const session = supabase ? (await supabase.auth.getUser()).data.user : null;
    if (!session) {
      return (
        <div className="min-h-full">
          <SiteHeader />
          <main className="mx-auto w-full max-w-2xl px-4 py-10">
            <Card className="p-8">
              <p className="text-sm font-medium">Sign in to view your plans</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Plans are saved per account when Supabase is configured.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button asChild>
                  <Link href="/auth/sign-in">Sign in</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/auth/sign-up">Create account</Link>
                </Button>
              </div>
            </Card>
          </main>
        </div>
      );
    }
  }

  const plans = await getPlansForCurrentUser();

  return (
    <div className="min-h-full">
      <SiteHeader />
      <main className="relative mx-auto w-full max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-6">
          <header className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="font-heading text-2xl font-semibold tracking-tight gradient-text">
                  Plans
                </h1>
                <p className="text-sm text-muted-foreground">
                  Create a plan, add options from saved events, and vote.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button asChild variant="outline">
                  <Link href="/plans/join">Join a plan</Link>
                </Button>
                <CreatePlanDialog />
              </div>
            </div>
          </header>

          {plans.length === 0 ? (
            <Card className="p-8">
              <p className="text-sm font-medium">No plans yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Save a few events in Discover, then create a plan to vote and
                build an itinerary.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button asChild variant="outline">
                  <Link href="/discover">Discover events</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/plans/join">Join with invite code</Link>
                </Button>
                <CreatePlanDialog />
              </div>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-3 animate-fade-up">
              {plans.map((p) => (
                <Card key={p.id} className="p-6 card-hover gradient-border">
                  <p className="text-xs text-muted-foreground">
                    {p.city ? `${p.city} • ` : ""}
                    {p.planDate}
                  </p>
                  <p className="mt-2 line-clamp-2 font-heading text-base font-semibold tracking-tight">
                    {p.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {p.description || "No description."}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Invite {p.inviteCode}</p>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/plans/${p.id}`}>Open</Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
