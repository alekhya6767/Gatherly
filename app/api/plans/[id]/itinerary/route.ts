import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  parsePlansCookie,
  PLANS_COOKIE_NAME,
  serializePlansCookie,
} from "@/lib/plans/storage";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Direction = "up" | "down";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as
    | { eventSlug?: unknown; direction?: unknown }
    | null;

  const eventSlug = typeof body?.eventSlug === "string" ? body.eventSlug.trim() : "";
  const direction: Direction | null =
    body?.direction === "up" || body?.direction === "down" ? body.direction : null;

  if (!eventSlug || !direction) {
    return NextResponse.json(
      { ok: false, error: "Invalid reorder request" },
      { status: 400 },
    );
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

    // Resolve event_id
    const { data: ev } = await supabase
      .from("events")
      .select("id")
      .eq("slug", eventSlug)
      .maybeSingle();

    if (!ev) {
      return NextResponse.json({ ok: false, error: "Event not found" }, { status: 404 });
    }

    type Row = { id: string; sort_order: number; event: { slug: string } | null };
    const { data: rows, error } = await supabase
      .from("plan_events")
      .select("id,sort_order,event:events(slug)")
      .eq("plan_id", id)
      .order("sort_order", { ascending: true });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    const items = (rows ?? []) as unknown as Row[];
    const idx = items.findIndex((r) => r.event?.slug === eventSlug);
    if (idx < 0) {
      return NextResponse.json({ ok: false, error: "Event not in plan" }, { status: 404 });
    }

    const swapWith = direction === "up" ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= items.length) {
      return NextResponse.json({ ok: true });
    }

    const a = items[idx];
    const b = items[swapWith];

    await supabase.from("plan_events").update({ sort_order: b.sort_order }).eq("id", a.id);
    await supabase.from("plan_events").update({ sort_order: a.sort_order }).eq("id", b.id);

    return NextResponse.json({ ok: true });
  }

  const cookieStore = await cookies();
  const current = parsePlansCookie(cookieStore.get(PLANS_COOKIE_NAME)?.value);

  const planEvents = current.events
    .filter((e) => e.planId === id)
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const idx = planEvents.findIndex((e) => e.eventSlug === eventSlug);
  if (idx < 0) {
    return NextResponse.json({ ok: false, error: "Event not in plan" }, { status: 404 });
  }

  const swapWith = direction === "up" ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= planEvents.length) {
    return NextResponse.json({ ok: true });
  }

  const a = planEvents[idx];
  const b = planEvents[swapWith];

  const updatedEvents = current.events.map((e) => {
    if (e.id === a.id) return { ...e, sortOrder: b.sortOrder };
    if (e.id === b.id) return { ...e, sortOrder: a.sortOrder };
    return e;
  });

  // Normalize sortOrder to contiguous integers to keep state predictable.
  const normalized = updatedEvents
    .filter((e) => e.planId === id)
    .slice()
    .sort((x, y) => x.sortOrder - y.sortOrder)
    .map((e, i) => ({ ...e, sortOrder: i + 1 }));

  const normalizedMap = new Map(normalized.map((e) => [e.id, e.sortOrder] as const));
  const next = {
    ...current,
    events: updatedEvents.map((e) => {
      const so = normalizedMap.get(e.id);
      return typeof so === "number" ? { ...e, sortOrder: so } : e;
    }),
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
