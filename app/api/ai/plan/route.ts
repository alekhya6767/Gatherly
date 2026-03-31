import { NextResponse } from "next/server";

import { getAIPlannerProvider } from "@/lib/ai/get-provider";
import { aiPlanRequestSchema } from "@/lib/ai/schemas";
import { getEventsRepository } from "@/lib/events/get-events-repo";

export async function POST(req: Request) {
  const json = (await req.json().catch(() => null)) as unknown;
  const parsed = aiPlanRequestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid input" },
      { status: 400 },
    );
  }

  const input = parsed.data;

  const repo = getEventsRepository();
  const candidates = await repo.listDiscoverEvents({
    q: undefined,
    city: input.city,
    category: undefined,
    start: undefined,
    end: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    sort: "trending",
  });

  if (candidates.length === 0) {
    return NextResponse.json(
      { ok: false, error: "No events available for that city." },
      { status: 404 },
    );
  }

  const provider = getAIPlannerProvider();

  try {
    const plan = await provider.generatePlan(input, candidates);
    return NextResponse.json({ ok: true, provider: provider.name, plan });
  } catch (e) {
    const message = e instanceof Error ? e.message : "AI generation failed";
    return NextResponse.json(
      { ok: false, error: message, provider: provider.name },
      { status: 500 },
    );
  }
}
