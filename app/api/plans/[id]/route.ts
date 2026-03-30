import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  parsePlansCookie,
  PLANS_COOKIE_NAME,
  serializePlansCookie,
  toPlanAggregate,
} from "@/lib/plans/storage";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const env = getSupabaseEnv();
  if (env) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: "Supabase unavailable" }, { status: 500 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const { data: planRow, error: planErr } = await supabase
      .from("plans")
      .select(
        "id,owner_id,title,description,city,plan_date,budget,vibe,visibility,invite_code,created_at,updated_at",
      )
      .eq("id", id)
      .maybeSingle();

    if (planErr || !planRow) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    type PlanEventRow = { sort_order: number; event: { slug: string } | null };
    const { data: peRows } = await supabase
      .from("plan_events")
      .select("sort_order,event:events(slug)")
      .eq("plan_id", id)
      .order("sort_order", { ascending: true });

    type VoteRow = { value: number; event: { slug: string } | null };
    const { data: voteRows } = await supabase
      .from("votes")
      .select("value,event:events(slug)")
      .eq("plan_id", id);

    type CommentRow = { user_id: string; body: string; created_at: string };
    const { data: commentRows } = await supabase
      .from("comments")
      .select("user_id,body,created_at")
      .eq("plan_id", id)
      .order("created_at", { ascending: true });

    const aggregate = {
      plan: {
        id: planRow.id as string,
        ownerId: (planRow.owner_id as string) ?? "",
        title: planRow.title as string,
        description: (planRow.description as string | null) ?? "",
        city: (planRow.city as string | null) ?? "",
        planDate: (planRow.plan_date as string | null) ?? "",
        budget: typeof planRow.budget === "number" ? planRow.budget : 0,
        vibe: (planRow.vibe as string | null) ?? "",
        visibility:
          (planRow.visibility as string) === "link" ? ("link" as const) : ("private" as const),
        inviteCode: planRow.invite_code as string,
        createdAt: new Date(planRow.created_at as string).toISOString(),
        updatedAt: new Date(planRow.updated_at as string).toISOString(),
      },
      events: ((peRows ?? []) as unknown as PlanEventRow[])
        .map((r) => ({
          eventSlug: r.event?.slug,
          sortOrder: r.sort_order,
        }))
        .filter(
          (r): r is { eventSlug: string; sortOrder: number } =>
            typeof r.eventSlug === "string",
        ),
      votes: ((voteRows ?? []) as unknown as VoteRow[])
        .map((r) => ({
          eventSlug: r.event?.slug,
          value: r.value === 1 ? 1 : -1,
        }))
        .filter(
          (r): r is { eventSlug: string; value: 1 | -1 } =>
            typeof r.eventSlug === "string" && (r.value === 1 || r.value === -1),
        ),
      comments: ((commentRows ?? []) as unknown as CommentRow[]).map((c) => ({
        id: `${c.user_id}-${c.created_at}`,
        planId: id,
        authorKey: c.user_id,
        body: c.body,
        createdAt: new Date(c.created_at).toISOString(),
      })),
    };

    return NextResponse.json({ ok: true, aggregate });
  }

  const cookieStore = await cookies();
  const data = parsePlansCookie(cookieStore.get(PLANS_COOKIE_NAME)?.value);
  const agg = toPlanAggregate(data, id);
  if (!agg) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, aggregate: agg });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as
    | { title?: unknown; description?: unknown }
    | null;

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

    const title = typeof body?.title === "string" ? body.title.trim() : undefined;
    const description =
      typeof body?.description === "string" ? body.description.trim() : undefined;

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof title === "string") patch.title = title;
    if (typeof description === "string") patch.description = description;

    const { data, error } = await supabase
      .from("plans")
      .update(patch)
      .eq("id", id)
      .select(
        "id,owner_id,title,description,city,plan_date,budget,vibe,visibility,invite_code,created_at,updated_at",
      )
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    const plan = {
      id: data.id as string,
      ownerId: (data.owner_id as string) ?? user.id,
      title: data.title as string,
      description: (data.description as string | null) ?? "",
      city: (data.city as string | null) ?? "",
      planDate: (data.plan_date as string | null) ?? "",
      budget: typeof data.budget === "number" ? data.budget : 0,
      vibe: (data.vibe as string | null) ?? "",
      visibility:
        (data.visibility as string) === "link" ? ("link" as const) : ("private" as const),
      inviteCode: data.invite_code as string,
      createdAt: new Date(data.created_at as string).toISOString(),
      updatedAt: new Date(data.updated_at as string).toISOString(),
    };

    return NextResponse.json({ ok: true, plan });
  }

  const cookieStore = await cookies();
  const current = parsePlansCookie(cookieStore.get(PLANS_COOKIE_NAME)?.value);

  const idx = current.plans.findIndex((p) => p.id === id);
  if (idx < 0) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  const plan = current.plans[idx];
  const title = typeof body?.title === "string" ? body.title.trim() : plan.title;
  const description =
    typeof body?.description === "string" ? body.description.trim() : plan.description;

  const updated = { ...plan, title, description, updatedAt: new Date().toISOString() };

  const next = {
    ...current,
    plans: current.plans.map((p) => (p.id === id ? updated : p)),
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

  return NextResponse.json({ ok: true, plan: updated });
}

export async function DELETE(
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

    await supabase.from("plans").delete().eq("id", id);
    return NextResponse.json({ ok: true });
  }

  const cookieStore = await cookies();
  const current = parsePlansCookie(cookieStore.get(PLANS_COOKIE_NAME)?.value);

  const next = {
    plans: current.plans.filter((p) => p.id !== id),
    events: current.events.filter((e) => e.planId !== id),
    votes: current.votes.filter((v) => v.planId !== id),
    comments: current.comments.filter((c) => c.planId !== id),
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
