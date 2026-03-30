import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { makeId } from "@/lib/plans/ids";
import {
  parsePlansCookie,
  PLANS_COOKIE_NAME,
  serializePlansCookie,
  toPlanAggregate,
} from "@/lib/plans/storage";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as { eventSlug?: unknown } | null;
  const eventSlug = typeof body?.eventSlug === "string" ? body.eventSlug.trim() : "";

  if (!eventSlug) {
    return NextResponse.json({ ok: false, error: "Missing eventSlug" }, { status: 400 });
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

    const { data: maxRow } = await supabase
      .from("plan_events")
      .select("sort_order")
      .eq("plan_id", id)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextSortOrder =
      typeof (maxRow as { sort_order?: number } | null)?.sort_order === "number"
        ? ((maxRow as { sort_order: number }).sort_order ?? 0) + 1
        : 1;

    const { error } = await supabase.from("plan_events").insert({
      plan_id: id,
      event_id: (ev as { id: string }).id,
      sort_order: nextSortOrder,
    });

    if (error && !/duplicate key/i.test(error.message)) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  }

  const cookieStore = await cookies();
  const current = parsePlansCookie(cookieStore.get(PLANS_COOKIE_NAME)?.value);

  const agg = toPlanAggregate(current, id);
  if (!agg) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  const exists = current.events.some((e) => e.planId === id && e.eventSlug === eventSlug);
  if (exists) return NextResponse.json({ ok: true });

  const nextSortOrder =
    Math.max(0, ...current.events.filter((e) => e.planId === id).map((e) => e.sortOrder)) +
    1;

  const item = {
    id: makeId("pe"),
    planId: id,
    eventSlug,
    note: "",
    startsAt: null,
    endsAt: null,
    sortOrder: nextSortOrder,
    createdAt: new Date().toISOString(),
  };

  const next = {
    ...current,
    events: [...current.events, item],
  };

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

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as { eventSlug?: unknown } | null;
  const eventSlug = typeof body?.eventSlug === "string" ? body.eventSlug.trim() : "";

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

    if (ev) {
      const eventId = (ev as { id: string }).id;
      await supabase
        .from("plan_events")
        .delete()
        .eq("plan_id", id)
        .eq("event_id", eventId);

      await supabase
        .from("votes")
        .delete()
        .eq("plan_id", id)
        .eq("event_id", eventId);
    }

    return NextResponse.json({ ok: true });
  }

  const cookieStore = await cookies();
  const current = parsePlansCookie(cookieStore.get(PLANS_COOKIE_NAME)?.value);

  const next = {
    ...current,
    events: current.events.filter((e) => !(e.planId === id && e.eventSlug === eventSlug)),
    votes: current.votes.filter((v) => !(v.planId === id && v.eventSlug === eventSlug)),
  };

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
