import { OpenAIEmbeddings } from "@langchain/openai";
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";

export const EMBEDDING_MODEL = "text-embedding-3-small";

/** Embeddings always go through OpenAI regardless of chat provider — Anthropic
 * has no first-party embeddings API. */
export function hasEmbeddingsProvider() {
  return !!process.env.OPENAI_API_KEY;
}

export function getEmbeddings() {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAIEmbeddings({ model: EMBEDDING_MODEL });
}

export type ChatProvider = "openai" | "anthropic" | null;

export function getChatProvider(): ChatProvider {
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
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
  return null;
}
