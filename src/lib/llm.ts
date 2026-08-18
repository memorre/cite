import { OpenAIEmbeddings } from "@langchain/openai";
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";

export const EMBEDDING_MODEL = "text-embedding-3-small";

/** Embeddings always go through OpenAI regardless of chat provider — neither
 * Anthropic nor Moonshot/Kimi expose a first-party embeddings API. */
export function hasEmbeddingsProvider() {
  return !!process.env.OPENAI_API_KEY;
}

export function getEmbeddings() {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAIEmbeddings({ model: EMBEDDING_MODEL });
}

export type ChatProvider = "openai" | "anthropic" | "kimi" | null;

export function getChatProvider(): ChatProvider {
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.MOONSHOT_API_KEY) return "kimi";
  return null;
}

export function getChatModel() {
  const provider = getChatProvider();
  if (provider === "openai") {
    return new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0.2 });
  }
  if (provider === "anthropic") {
    return new ChatAnthropic({ model: "claude-haiku-4-5-20251001", temperature: 0.2 });
  }
  if (provider === "kimi") {
    // Moonshot AI's Kimi models via their OpenAI-compatible endpoint.
    // Chat only — Kimi has no embeddings API, so this provider alone can't
    // power retrieval (see hasEmbeddingsProvider above).
    return new ChatOpenAI({
      apiKey: process.env.MOONSHOT_API_KEY,
      model: "kimi-k2.6",
      // Kimi models only accept the default temperature (1) — passing any
      // other value 400s.
      configuration: { baseURL: "https://api.moonshot.cn/v1" },
    });
  }
  return null;
}
