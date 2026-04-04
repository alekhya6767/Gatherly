import type { AIPlannerProvider } from "@/lib/ai/provider";
import { getOpenAIEnv } from "@/lib/ai/env";
import { mockAIPlannerProvider } from "@/lib/ai/mock-provider";
import { openAIPlannerProvider } from "@/lib/ai/openai-provider";

export function getAIPlannerProvider(): AIPlannerProvider {
  const env = getOpenAIEnv();
  if (env) return openAIPlannerProvider;
  return mockAIPlannerProvider;
}
