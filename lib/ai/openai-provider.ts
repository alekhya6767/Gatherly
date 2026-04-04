import type { AIPlannerProvider } from "@/lib/ai/provider";
import { aiPlanResponseSchema, type AIPlanRequest, type AIPlanResponse } from "@/lib/ai/schemas";
import { getOpenAIEnv } from "@/lib/ai/env";
import type { EventRecord } from "@/types/event";

type OpenAIChatCompletionResponse = {
  choices: Array<{
    message: {
      content: string | null;
    };
  }>;
};

function safeJsonParse(s: string): unknown {
  try {
    // Strip markdown code fences that some models wrap around JSON
    const stripped = s
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
    return JSON.parse(stripped);
  } catch {
    return null;
  }
}

export const openAIPlannerProvider: AIPlannerProvider = {
  name: "openai",
  async generatePlan(input: AIPlanRequest, candidates: readonly EventRecord[]): Promise<AIPlanResponse> {
    const env = getOpenAIEnv();
    if (!env) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const compactCandidates = candidates.slice(0, 60).map((e) => ({
      slug: e.slug,
      title: e.title,
      city: e.city,
      category: e.category,
      startsAt: e.startsAt,
      endsAt: e.endsAt,
      priceMin: e.priceMin,
      priceMax: e.priceMax,
      tags: e.tags,
    }));

    const system =
      "You are an assistant that creates group outing plans grounded ONLY in the provided event catalog. " +
      "Do not invent events. Output ONLY valid JSON matching the provided schema — no markdown, no code fences, no explanation. " +
      "IMPORTANT scheduling rules: " +
      "1. Spread activities across the FULL day starting from morning (08:00–10:00) unless the user specifies a time window. " +
      "2. Include a mix of morning, afternoon, and evening slots — do not cluster everything at night. " +
      "3. Use the actual event startsAt/endsAt times from the catalog when scheduling. " +
      "4. Add buffer/travel time between events (at least 30 minutes). " +
      "5. If the user mentions breakfast, lunch, dinner, or trek — include appropriate time slots for those.";

    const user = {
      input,
      candidates: compactCandidates,
      output_schema: {
        summary: "string",
        selectedEventSlugs: "string[] (must be in candidates.slug)",
        itinerary: [
          {
            startTime: "string 24h format (e.g. 09:00 for morning, 13:00 for afternoon, 19:00 for evening)",
            endTime: "string 24h format (e.g. 11:00)",
            title: "string",
            eventSlug: "string | null (must be in candidates.slug if not null)",
            notes: "string",
          },
        ],
        estimatedTotalCost: "number",
        rationale: "string",
        backupOptions: "string[] (candidate slugs)",
      },
    };

    const res = await fetch(`${env.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${env.apiKey}`,
      },
      body: JSON.stringify({
        model: env.model,
        temperature: 0.2,
        messages: [
          { role: "system", content: system },
          { role: "user", content: JSON.stringify(user) },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`AI request failed (${res.status}): ${text || res.statusText}`);
    }

    const data = (await res.json()) as OpenAIChatCompletionResponse;
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("AI returned empty content");

    const json = safeJsonParse(content);
    const parsed = aiPlanResponseSchema.safeParse(json);
    if (!parsed.success) {
      throw new Error("AI response was not valid structured JSON");
    }

    // Safety: ensure grounded.
    const allowed = new Set(compactCandidates.map((c) => c.slug));
    const grounded = parsed.data.selectedEventSlugs.every((s) => allowed.has(s));
    if (!grounded) throw new Error("AI returned events not in the catalog");

    return parsed.data;
  },
};
