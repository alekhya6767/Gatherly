import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  parsePlansCookie,
  PLANS_COOKIE_NAME,
  type PlansCookie,
} from "@/lib/plans/storage";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function findPlanIdByInvite(cookie: PlansCookie, inviteCode: string) {
  return cookie.plans.find((p) => p.inviteCode === inviteCode)?.id ?? null;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { inviteCode?: unknown } | null;
  const inviteCode = typeof body?.inviteCode === "string" ? body.inviteCode.trim() : "";

  if (!inviteCode) {
    return NextResponse.json(
      { ok: false, error: "Invite code is required" },
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

    // Use rpc to look up plan by invite code bypassing RLS
    // (the joining user isn't a member yet, so direct select would return null)
    const { data: plan, error } = await supabase
      .rpc("find_plan_by_invite_code", { p_invite_code: inviteCode })
      .maybeSingle();

    if (error || !plan) {
      return NextResponse.json({ ok: false, error: "Invite code not found" }, { status: 404 });
    }

    // best effort insert; policy should allow self-join for link plans.
    const { error: insErr } = await supabase.from("plan_members").insert({
      plan_id: (plan as { id: string }).id,
      user_id: user.id,
      email: user.email,
      role: "member",
      status: "active",
    });

    if (insErr && !/duplicate/i.test(insErr.message)) {
      return NextResponse.json({ ok: false, error: insErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, id: (plan as { id: string }).id });
  }

  const cookieStore = await cookies();
  const cookie = parsePlansCookie(cookieStore.get(PLANS_COOKIE_NAME)?.value);
  const id = findPlanIdByInvite(cookie, inviteCode);

  if (!id) {
    return NextResponse.json(
      { ok: false, error: "Invite code not found in local demo." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, id });
}
