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

function getAuthorKey(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  const existing = cookieStore.get("pt_author")?.value;
  if (existing) return existing;

  const next = makeId("a");
  cookieStore.set({
    name: "pt_author",
    value: next,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return next;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

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

    type CommentRow = { user_id: string; body: string; created_at: string };
    const { data, error } = await supabase
      .from("comments")
      .select("user_id,body,created_at")
      .eq("plan_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    const rows = (data ?? []) as unknown as CommentRow[];

    // Self-heal: ensure the current user always has a profile row
    if (user.email) {
      await supabase.from("profiles").upsert(
        { id: user.id, display_name: user.email.split("@")[0] },
        { onConflict: "id", ignoreDuplicates: true },
      );
    }

    // Best-effort: fetch display names from profiles
    const userIds = [...new Set(rows.map((c) => c.user_id))];
    let nameMap: Record<string, string> = {};
    // Always seed current user's name from auth
    if (user.email) nameMap[user.id] = user.email.split("@")[0];
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,display_name,email")
        .in("id", userIds);
      for (const p of profiles ?? []) {
        const row = p as { id: string; display_name: string | null; email: string | null };
        const name = row.display_name ?? (row.email ? row.email.split("@")[0] : null);
        if (name) nameMap[row.id] = name;
      }
    }

    const comments = rows.map((c) => ({
      id: `${c.user_id}-${c.created_at}`,
      planId: id,
      authorKey: c.user_id,
      authorName: nameMap[c.user_id] ?? `User-${c.user_id.slice(0, 6)}`,
      body: c.body,
      createdAt: new Date(c.created_at).toISOString(),
    }));

    return NextResponse.json({ ok: true, comments });
  }

  const cookieStore = await cookies();
  const current = parsePlansCookie(cookieStore.get(PLANS_COOKIE_NAME)?.value);
  const agg = toPlanAggregate(current, id);
  if (!agg) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, comments: agg.comments });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as { body?: unknown } | null;
  const commentBody = typeof body?.body === "string" ? body.body.trim() : "";

  if (!commentBody) {
    return NextResponse.json(
      { ok: false, error: "Comment is required" },
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

    // Ensure profile row exists with at least the email prefix as display_name
    await supabase.from("profiles").upsert(
      { id: user.id, display_name: user.email?.split("@")[0] ?? "User" },
      { onConflict: "id", ignoreDuplicates: true },
    );

    const { error } = await supabase.from("comments").insert({
      plan_id: id,
      user_id: user.id,
      body: commentBody,
    });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  }

  const cookieStore = await cookies();
  const authorKey = getAuthorKey(cookieStore);
  const current = parsePlansCookie(cookieStore.get(PLANS_COOKIE_NAME)?.value);
  const agg = toPlanAggregate(current, id);
  if (!agg) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  const now = new Date().toISOString();
  const next = {
    ...current,
    comments: [
      ...current.comments,
      {
        id: makeId("c"),
        planId: id,
        authorKey,
        authorName: "You",
        body: commentBody,
        createdAt: now,
      },
    ],
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
