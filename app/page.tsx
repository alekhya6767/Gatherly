import Link from "next/link";
import { ArrowRight, Search, LayoutDashboard, Sparkles } from "lucide-react";

import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-full">
      <SiteHeader />

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-primary/25 blur-3xl animate-float" />
            <div className="absolute -right-24 top-32 h-80 w-80 rounded-full bg-violet-500/15 blur-3xl animate-float animate-delay-300" />
            <div className="absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-indigo-400/10 blur-3xl animate-float animate-delay-200" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.5_0.24_264/0.08),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,oklch(0.5_0.24_264/0.15),transparent_60%)]" />
          </div>

          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">AI-powered planning</Badge>
                <Badge variant="outline">Demo-first</Badge>
              </div>

              <h1 className="font-heading text-4xl font-semibold tracking-tight md:text-6xl animate-fade-up">
                <span className="gradient-text">Discover events.</span>
                <br />
                Decide together.
              </h1>

              <p className="max-w-prose text-base leading-7 text-muted-foreground md:text-lg animate-fade-up animate-delay-100">
                Gatherly helps groups shortlist options, vote, and build an
                itinerary — plus an AI planner that turns your preferences into a
                grounded outing plan.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row animate-fade-up animate-delay-200">
                <Button asChild size="lg">
                  <Link href="/discover">Explore events</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/plans">Create a plan</Link>
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                No ticketing. No spam. Built for collaborative planning.
              </p>
            </div>

            <div className="grid gap-4 animate-fade-up animate-delay-300">
              <Card className="p-6 card-hover glass">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">Friday Night: Food + Jazz</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      4 options • 9 votes • Itinerary ready
                    </p>
                  </div>
                  <Badge>Trending</Badge>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border bg-muted/30 p-4">
                    <p className="text-sm font-medium">7:00 PM</p>
                    <p className="text-sm text-muted-foreground">Ramen tasting</p>
                  </div>
                  <div className="rounded-xl border bg-muted/30 p-4">
                    <p className="text-sm font-medium">9:00 PM</p>
                    <p className="text-sm text-muted-foreground">Live jazz set</p>
                  </div>
                </div>
              </Card>

              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="p-6 card-hover">
                  <p className="text-sm font-medium">Shortlist</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Save options while you browse.
                  </p>
                </Card>
                <Card className="p-6 card-hover">
                  <p className="text-sm font-medium">Vote + decide</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Consensus without group chat chaos.
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="grid gap-4 md:grid-cols-3 animate-fade-up">
            <Link href="/discover" className="group">
              <Card className="h-full p-6 card-hover gradient-border">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Search className="h-5 w-5 text-primary" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>
                <p className="mt-4 text-sm font-semibold gradient-text">Search & filters</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Filter by city, category, budget — find the right event instantly.
                </p>
              </Card>
            </Link>
            <Link href="/plans" className="group">
              <Card className="h-full p-6 card-hover gradient-border animate-delay-100">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <LayoutDashboard className="h-5 w-5 text-primary" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>
                <p className="mt-4 text-sm font-semibold gradient-text">Plans dashboard</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create a plan, invite friends, vote on options, and lock in the itinerary.
                </p>
              </Card>
            </Link>
            <Link href="/ai-planner" className="group">
              <Card className="h-full p-6 card-hover gradient-border animate-delay-200">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>
                <p className="mt-4 text-sm font-semibold gradient-text">AI planner</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tell the AI your vibe and budget — get a full day itinerary grounded in real events.
                </p>
              </Card>
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
