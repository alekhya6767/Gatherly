import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { makeId, makeInviteCode, todayISODate } from "@/lib/plans/ids";
import {
  parsePlansCookie,
  PLANS_COOKIE_NAME,
  serializePlansCookie,
} from "@/lib/plans/storage";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const env = getSupabaseEnv();
  if (env) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return NextResponse.json({ plans: [] });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ plans: [] });

    type PlanRow = { id: string; title: string };
    const { data, error } = await supabase
      .from("plans")
      .select("id,title")
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ plans: [] });

    const plans = (data ?? []) as unknown as PlanRow[];
    return NextResponse.json({ plans });
  }

  const cookieStore = await cookies();
  const data = parsePlansCookie(cookieStore.get(PLANS_COOKIE_NAME)?.value);
  return NextResponse.json({ plans: data.plans });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | {
        title?: unknown;
        description?: unknown;
        city?: unknown;
        planDate?: unknown;
        budget?: unknown;
        vibe?: unknown;
      }
    | null;

  const title = typeof body?.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json({ ok: false, error: "Title is required" }, { status: 400 });
  }

  const description = typeof body?.description === "string" ? body.description.trim() : "";
  const city = typeof body?.city === "string" ? body.city.trim() : "";
  const planDate = typeof body?.planDate === "string" ? body.planDate : todayISODate();
  const budget = typeof body?.budget === "number" ? body.budget : 75;
  const vibe = typeof body?.vibe === "string" ? body.vibe.trim() : "chill";

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

    const inviteCode = makeInviteCode();
    const { data, error } = await supabase
      .from("plans")
      .insert({
        owner_id: user.id,
        title,
        description,
        city,
        plan_date: planDate,
        budget: Math.round(budget),
        vibe,
        visibility: "link",
        invite_code: inviteCode,
      })
      .select(
        "id,title,description,city,plan_date,budget,vibe,visibility,invite_code,created_at,updated_at",
      )
      .single();

    if (error || !data) {
      return NextResponse.json(
        { ok: false, error: error?.message ?? "Failed to create" },
        { status: 400 },
      );
    }

    const plan = {
      id: data.id as string,
      ownerId: user.id,
      title: data.title as string,
      description: (data.description as string | null) ?? "",
      city: (data.city as string | null) ?? "",
      planDate: (data.plan_date as string | null) ?? todayISODate(),
      budget: typeof data.budget === "number" ? data.budget : 0,
      vibe: (data.vibe as string | null) ?? "",
      visibility: (data.visibility as string) === "link" ? ("link" as const) : ("private" as const),
      inviteCode: data.invite_code as string,
      createdAt: new Date(data.created_at as string).toISOString(),
      updatedAt: new Date(data.updated_at as string).toISOString(),
    };

    return NextResponse.json({ ok: true, plan });
  }

  const cookieStore = await cookies();
  const current = parsePlansCookie(cookieStore.get(PLANS_COOKIE_NAME)?.value);

  const now = new Date().toISOString();
  const planId = makeId("plan");

  const plan = {
    id: planId,
    ownerId: "local",
    title,
    description,
    city,
    planDate,
    budget,
    vibe,
    visibility: "link" as const,
    inviteCode: makeInviteCode(),
    createdAt: now,
    updatedAt: now,
  };

  const next = {
    ...current,
    plans: [plan, ...current.plans],
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

  return NextResponse.json({ ok: true, plan });
}
