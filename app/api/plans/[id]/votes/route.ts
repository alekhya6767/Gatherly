import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { makeId } from "@/lib/plans/ids";
import {
  parsePlansCookie,
  PLANS_COOKIE_NAME,
  serializePlansCookie,
} from "@/lib/plans/storage";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { VoteValue } from "@/types/plan";

function getVoterKey(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  const existing = cookieStore.get("pt_voter")?.value;
  if (existing) return existing;

  const next = makeId("v");
  cookieStore.set({
    name: "pt_voter",
    value: next,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return next;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as
    | { eventSlug?: unknown; value?: unknown }
    | null;

  const eventSlug = typeof body?.eventSlug === "string" ? body.eventSlug.trim() : "";
  const value: VoteValue | null = body?.value === 1 || body?.value === -1 ? body.value : null;

  if (!eventSlug || !value) {
    return NextResponse.json({ ok: false, error: "Invalid vote" }, { status: 400 });
  }

  const env = getSupabaseEnv();
  if (env) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return NextResponse.json({ ok: false }, { status: 500 });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const { data: ev } = await supabase
      .from("events")
      .select("id")
      .eq("slug", eventSlug)
      .maybeSingle();

    if (!ev) {
      return NextResponse.json({ ok: false, error: "Event not found" }, { status: 404 });
    }

    const eventId = (ev as { id: string }).id;

    const { error } = await supabase.from("votes").upsert(
      {
        plan_id: id,
        event_id: eventId,
        user_id: user.id,
        value,
      },
      { onConflict: "plan_id,event_id,user_id" },
    );

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  }

  const cookieStore = await cookies();
  const voterKey = getVoterKey(cookieStore);
  const current = parsePlansCookie(cookieStore.get(PLANS_COOKIE_NAME)?.value);

  const existing = current.votes.find(
    (v) => v.planId === id && v.eventSlug === eventSlug && v.voterKey === voterKey,
  );

  const now = new Date().toISOString();
  const nextVotes = existing
    ? current.votes.map((v) =>
        v.id === existing.id ? { ...v, value, createdAt: now } : v,
      )
    : [
        ...current.votes,
        {
          id: makeId("vote"),
          planId: id,
          eventSlug,
          voterKey,
          value,
          createdAt: now,
        },
      ];

  const next = { ...current, votes: nextVotes };

  cookieStore.set({
    name: PLANS_COOKIE_NAME,
    value: serializePlansCookie(next),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });

  return NextResponse.json({ ok: true });
}
