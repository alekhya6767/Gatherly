import type { AIPlannerProvider } from "@/lib/ai/provider";
import type { AIPlanRequest, AIPlanResponse } from "@/lib/ai/schemas";
import type { EventRecord } from "@/types/event";

function includesCI(h: string, n: string) {
  return h.toLowerCase().includes(n.toLowerCase());
}

function scoreEvent(e: EventRecord, input: AIPlanRequest) {
  let score = 0;

  if (e.city === input.city) score += 5;

  const vibe = input.vibe;
  const tagText = `${e.tags.join(" ")} ${e.category} ${e.title}`;

  if (vibe === "foodie" && includesCI(tagText, "food")) score += 3;
  if (vibe === "nightlife" && includesCI(tagText, "night")) score += 3;
  if (vibe === "artsy" && (e.category === "Arts" || includesCI(tagText, "museum"))) score += 3;
  if (vibe === "wellness" && e.category === "Wellness") score += 3;
  if (vibe === "active" && (e.category === "Outdoors" || includesCI(tagText, "active"))) score += 3;

  for (const i of input.interests) {
    if (includesCI(tagText, i)) score += 2;
  }

  const mid = (e.priceMin + e.priceMax) / 2;
  const perPersonBudget = Math.max(0, input.budget / input.groupSize);
  if (mid === 0) score += 1;
  if (mid <= perPersonBudget) score += 2;
  else score -= 1;

  // deterministic nudge based on slug
  score += (e.slug.charCodeAt(0) % 3) * 0.1;

  return score;
}

function formatMoney(n: number) {
  return `$${Math.round(n)}`;
}

export const mockAIPlannerProvider: AIPlannerProvider = {
  name: "mock",
  async generatePlan(input: AIPlanRequest, candidates: readonly EventRecord[]): Promise<AIPlanResponse> {
    const top = [...candidates]
      .filter((e) => e.city === input.city)
      .map((e) => ({ e, score: scoreEvent(e, input) }))
      .sort((a, b) => b.score - a.score)
      .map((x) => x.e)
      .slice(0, 6);

    const selected = top.slice(0, 3);
    const backup = top.slice(3).map((e) => e.slug);

    const estimated = selected.reduce((sum, e) => sum + (e.priceMin + e.priceMax) / 2, 0);

    const itinerary = selected.map((e, idx) => {
      const startHour = 18 + idx * 2;
      const start = `${String(startHour).padStart(2, "0")}:00`;
      const end = `${String(startHour + 2).padStart(2, "0")}:00`;
      return {
        startTime: start,
        endTime: end,
        title: e.title,
        eventSlug: e.slug,
        notes: `Plan for ~${formatMoney((e.priceMin + e.priceMax) / 2)} per person.`,
      };
    });

    return {
      summary: `A ${input.vibe} outing in ${input.city} for ${input.groupSize} — grounded in the local event catalog.`,
      selectedEventSlugs: selected.map((e) => e.slug),
      itinerary,
      estimatedTotalCost: Math.round(estimated),
      rationale:
        "Selected options match your city + vibe, prioritize group-friendly tags, and stay within budget where possible.",
      backupOptions: backup,
    };
  },
};
