import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  parseSavedEventsCookie,
  SAVED_EVENTS_COOKIE_NAME,
  serializeSavedEventsCookie,
} from "@/lib/saved-events/storage";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const bodySchema = {
  async parse(req: Request) {
    const data = (await req.json()) as unknown;
    if (!data || typeof data !== "object") throw new Error("Invalid body");

    const slug = (data as Record<string, unknown>).slug;
    if (typeof slug !== "string" || slug.trim().length === 0) throw new Error("Missing slug");

    return { slug: slug.trim() };
  },
};

export async function GET() {
  const env = getSupabaseEnv();

  if (env) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return NextResponse.json({ slugs: [] });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ slugs: [] });

    type SavedEventRow = {
      event: { slug: string } | null;
    };

    const { data, error } = await supabase
      .from("saved_events")
      .select("event:events(slug)")
      .eq("user_id", user.id);

    if (error) return NextResponse.json({ slugs: [] });

    const rows = (data ?? []) as unknown as SavedEventRow[];
    const slugs = rows
      .map((r) => r.event?.slug)
      .filter((s): s is string => typeof s === "string");

    return NextResponse.json({ slugs });
  }

  const cookieStore = await cookies();
  const saved = parseSavedEventsCookie(cookieStore.get(SAVED_EVENTS_COOKIE_NAME)?.value);
  return NextResponse.json(saved);
}

export async function POST(req: Request) {
  const { slug } = await bodySchema.parse(req);
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

    const { data: ev, error: evErr } = await supabase
      .from("events")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (evErr || !ev) {
      return NextResponse.json({ ok: false, error: "Event not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from("saved_events")
      .insert({ user_id: user.id, event_id: (ev as { id: string }).id });

    if (error) {
      // ignore duplicates
      if (!/duplicate key/i.test(error.message)) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json({ ok: true });
  }

  const cookieStore = await cookies();
  const current = parseSavedEventsCookie(cookieStore.get(SAVED_EVENTS_COOKIE_NAME)?.value);
  const next = { slugs: Array.from(new Set([...current.slugs, slug])) };

  cookieStore.set({
    name: SAVED_EVENTS_COOKIE_NAME,
    value: serializeSavedEventsCookie(next),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { slug } = await bodySchema.parse(req);
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
      .eq("slug", slug)
      .maybeSingle();

    if (!ev) return NextResponse.json({ ok: true });

    await supabase
      .from("saved_events")
      .delete()
      .eq("user_id", user.id)
      .eq("event_id", (ev as { id: string }).id);

    return NextResponse.json({ ok: true });
  }

  const cookieStore = await cookies();
  const current = parseSavedEventsCookie(cookieStore.get(SAVED_EVENTS_COOKIE_NAME)?.value);
  const next = { slugs: current.slugs.filter((s) => s !== slug) };

  cookieStore.set({
    name: SAVED_EVENTS_COOKIE_NAME,
    value: serializeSavedEventsCookie(next),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });

  return NextResponse.json({ ok: true });
}
