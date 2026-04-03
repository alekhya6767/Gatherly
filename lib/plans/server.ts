import { cookies } from "next/headers";

import {
  parsePlansCookie,
  PLANS_COOKIE_NAME,
  type PlansCookie,
} from "@/lib/plans/storage";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PlanRecord, PlanAggregate } from "@/types/plan";

export async function getPlansCookieServer(): Promise<PlansCookie> {
  const cookieStore = await cookies();
  return parsePlansCookie(cookieStore.get(PLANS_COOKIE_NAME)?.value);
}

function mapPlanRow(row: Record<string, unknown>): PlanRecord {
  return {
    id: row.id as string,
    ownerId: (row.owner_id as string) ?? "",
    title: row.title as string,
    description: (row.description as string | null) ?? "",
    city: (row.city as string | null) ?? "",
    planDate: (row.plan_date as string | null) ?? "",
    budget: typeof row.budget === "number" ? row.budget : 0,
    vibe: (row.vibe as string | null) ?? "",
    visibility: (row.visibility as string) === "link" ? "link" as const : "private" as const,
    inviteCode: row.invite_code as string,
    createdAt: new Date(row.created_at as string).toISOString(),
    updatedAt: new Date(row.updated_at as string).toISOString(),
  };
}

export async function getPlansForCurrentUser(): Promise<PlanRecord[]> {
  const env = getSupabaseEnv();
  if (!env) {
    const cookie = await getPlansCookieServer();
    return cookie.plans;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("plans")
    .select("id,owner_id,title,description,city,plan_date,budget,vibe,visibility,invite_code,created_at,updated_at")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return (data as Record<string, unknown>[]).map(mapPlanRow);
}

export async function getPlanAggregate(planId: string): Promise<PlanAggregate | null> {
  const env = getSupabaseEnv();
  if (!env) {
    const cookie = await getPlansCookieServer();
    const { toPlanAggregate } = await import("@/lib/plans/storage");
    return toPlanAggregate(cookie, planId);
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: planRow, error: planErr } = await supabase
    .from("plans")
    .select("id,owner_id,title,description,city,plan_date,budget,vibe,visibility,invite_code,created_at,updated_at")
    .eq("id", planId)
    .maybeSingle();

  if (planErr || !planRow) return null;

  type PlanEventRow = { id: string; sort_order: number; note: string | null; starts_at: string | null; ends_at: string | null; created_at: string; event: { slug: string } | null };
  const { data: peRows } = await supabase
    .from("plan_events")
    .select("id,sort_order,note,starts_at,ends_at,created_at,event:events(slug)")
    .eq("plan_id", planId)
    .order("sort_order", { ascending: true });

  type VoteRow = { id: string; value: number; user_id: string; created_at: string; event: { slug: string } | null };
  const { data: voteRows } = await supabase
    .from("votes")
    .select("id,value,user_id,created_at,event:events(slug)")
    .eq("plan_id", planId);

  type CommentRow = { id: string; user_id: string; body: string; created_at: string };
  const { data: commentRows } = await supabase
    .from("comments")
    .select("id,user_id,body,created_at")
    .eq("plan_id", planId)
    .order("created_at", { ascending: true });

  return {
    plan: mapPlanRow(planRow as Record<string, unknown>),
    events: ((peRows ?? []) as unknown as PlanEventRow[])
      .filter((r) => typeof r.event?.slug === "string")
      .map((r) => ({
        id: r.id,
        planId,
        eventSlug: r.event!.slug,
        note: r.note ?? "",
        startsAt: r.starts_at,
        endsAt: r.ends_at,
        sortOrder: r.sort_order,
        createdAt: r.created_at,
      })),
    votes: ((voteRows ?? []) as unknown as VoteRow[])
      .filter((r) => typeof r.event?.slug === "string" && (r.value === 1 || r.value === -1))
      .map((r) => ({
        id: r.id,
        planId,
        eventSlug: r.event!.slug,
        voterKey: r.user_id,
        value: r.value as 1 | -1,
        createdAt: r.created_at,
      })),
    comments: ((commentRows ?? []) as unknown as CommentRow[]).map((c) => ({
      id: c.id,
      planId,
      authorKey: c.user_id,
      body: c.body,
      createdAt: new Date(c.created_at).toISOString(),
    })),
  };
}
