import { HumanMessage, SystemMessage, type BaseMessage } from "@langchain/core/messages";
import { getChatModel, getEmbeddings } from "@/lib/llm";
import { searchSimilarChunks, type SimilarChunk } from "@/lib/vector";

const SYSTEM_PROMPT = `You are Cite, a document Q&A assistant. Answer the user's question using ONLY the excerpts provided below.
- If the excerpts don't contain enough information to answer, say so plainly — do not guess or use outside knowledge.
- Refer to sources inline using bracketed numbers like [1], [2] that correspond to the excerpt numbers below.
- Be concise and direct.`;

function buildContextBlock(chunks: SimilarChunk[]) {
  return chunks
    .map((c, i) => `[${i + 1}] (${c.documentTitle}${c.page ? `, p.${c.page}` : ""})\n${c.content}`)
    .join("\n\n");
}

export type Citation = {
  index: number;
  documentId: string;
  documentTitle: string;
  page: number | null;
  snippet: string;
};

export async function answerQuestion(params: { question: string; documentIds: string[]; history: BaseMessage[] }) {
  const embeddings = getEmbeddings();
  const chatModel = getChatModel();
  if (!embeddings || !chatModel) {
    throw new Error("No LLM provider configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.");
  }

  const queryVector = await embeddings.embedQuery(params.question);
  const chunks = await searchSimilarChunks(params.documentIds, queryVector, 6);
  const contextBlock = chunks.length > 0 ? buildContextBlock(chunks) : "(no relevant excerpts found)";

  const messages: BaseMessage[] = [
    new SystemMessage(`${SYSTEM_PROMPT}\n\nExcerpts:\n${contextBlock}`),
    ...params.history,
    new HumanMessage(params.question),
  ];

  const stream = await chatModel.stream(messages);

  const citations: Citation[] = chunks.map((c, i) => ({
    index: i + 1,
    documentId: c.documentId,
    documentTitle: c.documentTitle,
    page: c.page,
    snippet: c.content.slice(0, 240),
  }));

  return { stream, citations };
}
