export type OpenAIEnv = {
  apiKey: string;
  baseUrl: string;
  model: string;
};

export function getOpenAIEnv(): OpenAIEnv | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  return { apiKey, baseUrl, model };
}
