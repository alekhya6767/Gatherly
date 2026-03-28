import { NextResponse } from "next/server";

import { getEventsRepository } from "@/lib/events/get-events-repo";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slugs = url.searchParams.getAll("slug").filter((s) => s.length > 0);

  if (slugs.length === 0) {
    return NextResponse.json({ events: [] });
  }

  const repo = getEventsRepository();

  // Resolve each requested slug; ignore not-founds.
  const events = await Promise.all(
    slugs.slice(0, 50).map(async (slug) => {
      try {
        const e = await repo.getEventBySlug(slug);
        return e ? { slug: e.slug, title: e.title, city: e.city } : null;
      } catch {
        return null;
      }
    }),
  );

  return NextResponse.json({
    events: events.filter((e): e is NonNullable<typeof e> => e !== null),
  });
}
