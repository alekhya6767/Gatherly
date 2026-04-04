import type { AIPlanRequest, AIPlanResponse } from "@/lib/ai/schemas";
import type { EventRecord } from "@/types/event";

export type AIPlannerProvider = {
  generatePlan: (input: AIPlanRequest, candidates: readonly EventRecord[]) => Promise<AIPlanResponse>;
  name: string;
};
