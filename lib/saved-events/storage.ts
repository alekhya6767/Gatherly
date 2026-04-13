import { z } from "zod";

const savedEventsCookieSchema = z.object({
  slugs: z.array(z.string()).default([]),
});

export type SavedEventsCookie = z.infer<typeof savedEventsCookieSchema>;

export const SAVED_EVENTS_COOKIE_NAME = "pt_saved";

export function parseSavedEventsCookie(raw: string | undefined): SavedEventsCookie {
  if (!raw) return { slugs: [] };

  try {
    const json = JSON.parse(raw) as unknown;
    const parsed = savedEventsCookieSchema.safeParse(json);
    if (!parsed.success) return { slugs: [] };
    return parsed.data;
  } catch {
    return { slugs: [] };
  }
}

export function serializeSavedEventsCookie(cookie: SavedEventsCookie) {
  // Keep it small; no duplicates.
  const slugs = Array.from(new Set(cookie.slugs)).slice(0, 200);
  return JSON.stringify({ slugs });
}
