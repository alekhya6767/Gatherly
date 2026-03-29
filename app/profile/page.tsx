import Link from "next/link";

import { SiteHeader } from "@/components/shared/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getEventsRepository } from "@/lib/events/get-events-repo";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  parseSavedEventsCookie,
  SAVED_EVENTS_COOKIE_NAME,
} from "@/lib/saved-events/storage";
import { getPlansForCurrentUser, getPlansCookieServer } from "@/lib/plans/server";
import { cookies } from "next/headers";

type ProfileData = {
  displayName: string;
  email: string | null;
  bio: string;
  joinedAt: string | null;
  mode: "supabase" | "local";
};

async function loadProfile(): Promise<ProfileData | null> {
  const env = getSupabaseEnv();
  if (!env) {
    return {
      displayName: "Local demo",
      email: null,
      bio: "Local demo profile (no Supabase). Sign in with Supabase to get a real account.",
      joinedAt: null,
      mode: "local",
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name,bio,created_at")
    .eq("id", user.id)
    .maybeSingle();

  return {
    displayName: (profile?.display_name as string) ?? user.email?.split("@")[0] ?? "User",
    email: user.email ?? null,
    bio: (profile?.bio as string | null) ?? "",
    joinedAt: profile?.created_at ? new Date(profile.created_at as string).toISOString() : null,
    mode: "supabase",
  };
}

async function loadSavedSlugs(mode: "supabase" | "local"): Promise<string[]> {
  if (mode === "local") {
    const cookieStore = await cookies();
    return parseSavedEventsCookie(cookieStore.get(SAVED_EVENTS_COOKIE_NAME)?.value).slugs;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  type Row = { event: { slug: string } | null };
  const { data } = await supabase
    .from("saved_events")
    .select("event:events(slug)")
    .eq("user_id", user.id);

  return ((data ?? []) as unknown as Row[])
    .map((r) => r.event?.slug)
    .filter((s): s is string => typeof s === "string");
}

async function loadJoinedPlanCount(mode: "supabase" | "local"): Promise<number> {
  if (mode === "local") return 0;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return 0;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data, count } = await supabase
    .from("plan_members")
    .select("plan_id", { count: "exact", head: true })
    .eq("user_id", user.id);

  void data;
  return count ?? 0;
}

export default async function ProfilePage() {
  const profile = await loadProfile();

  if (!profile) {
    return (
      <div className="page-wrapper">
        <SiteHeader />
        <main className="mx-auto w-full max-w-2xl px-4 py-10">
          <Card className="p-8">
            <p className="text-sm font-medium">Sign in to view your profile</p>
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

  const [savedSlugs, plans, joinedCount] = await Promise.all([
    loadSavedSlugs(profile.mode),
    profile.mode === "supabase" ? getPlansForCurrentUser() : (await getPlansCookieServer()).plans,
    loadJoinedPlanCount(profile.mode),
  ]);

  // Hydrate saved events from the events repo
  const repo = getEventsRepository();
  const savedEvents = await Promise.all(savedSlugs.slice(0, 12).map((s) => repo.getEventBySlug(s)));
  const savedEventsClean = savedEvents.filter((e): e is NonNullable<typeof e> => e !== null);

  return (
    <div className="page-wrapper">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant={profile.mode === "supabase" ? "default" : "secondary"}>
                    {profile.mode === "supabase" ? "Supabase account" : "Local demo"}
                  </Badge>
                </div>
                <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight">
                  {profile.displayName}
                </h1>
                {profile.email ? (
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                ) : null}
                {profile.bio ? (
                  <p className="mt-2 max-w-prose text-sm text-muted-foreground">{profile.bio}</p>
                ) : null}
                {profile.joinedAt ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Joined {new Date(profile.joinedAt).toLocaleDateString()}
                  </p>
                ) : null}
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl border bg-muted/30 px-4 py-2">
                  <p className="text-2xl font-semibold">{savedSlugs.length}</p>
                  <p className="text-xs text-muted-foreground">Saved</p>
                </div>
                <div className="rounded-xl border bg-muted/30 px-4 py-2">
                  <p className="text-2xl font-semibold">{plans.length}</p>
                  <p className="text-xs text-muted-foreground">Plans</p>
                </div>
                <div className="rounded-xl border bg-muted/30 px-4 py-2">
                  <p className="text-2xl font-semibold">{joinedCount}</p>
                  <p className="text-xs text-muted-foreground">Joined</p>
                </div>
              </div>
            </div>
          </Card>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold tracking-tight">Your plans</h2>
              <Button asChild size="sm" variant="ghost">
                <Link href="/plans">All plans</Link>
              </Button>
            </div>
            {plans.length === 0 ? (
              <Card className="p-6">
                <p className="text-sm text-muted-foreground">
                  You haven&apos;t created any plans yet.{" "}
                  <Link href="/plans" className="underline underline-offset-4">
                    Start one
                  </Link>
                  .
                </p>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                {plans.slice(0, 6).map((p) => (
                  <Card key={p.id} className="p-5">
                    <p className="text-xs text-muted-foreground">
                      {p.city ? `${p.city} • ` : ""}
                      {p.planDate}
                    </p>
                    <p className="mt-1 line-clamp-2 font-heading text-base font-semibold tracking-tight">
                      {p.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {p.description || "No description."}
                    </p>
                    <div className="mt-4">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/plans/${p.id}`}>Open</Link>
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold tracking-tight">Saved events</h2>
              <Button asChild size="sm" variant="ghost">
                <Link href="/discover">Discover more</Link>
              </Button>
            </div>
            {savedEventsClean.length === 0 ? (
              <Card className="p-6">
                <p className="text-sm text-muted-foreground">
                  No saved events yet.{" "}
                  <Link href="/discover" className="underline underline-offset-4">
                    Browse Discover
                  </Link>
                  .
                </p>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                {savedEventsClean.map((e) => (
                  <Card key={e.id} className="p-5">
                    <p className="text-xs text-muted-foreground">{e.city}</p>
                    <Link
                      href={`/events/${e.slug}`}
                      className="mt-1 line-clamp-2 font-heading text-base font-semibold tracking-tight underline-offset-4 hover:underline"
                    >
                      {e.title}
                    </Link>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {e.description}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
