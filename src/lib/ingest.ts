import { prisma } from "@/lib/prisma";
import { getEmbeddings, hasEmbeddingsProvider } from "@/lib/llm";
import { setChunkEmbedding } from "@/lib/vector";
import { DOC_ERRORS } from "@/lib/doc-errors";

const BATCH_SIZE = 50;

/**
 * Embeds every not-yet-embedded chunk for a document and flips its status.
 * Safe to call more than once — already-embedded chunks aren't re-sent.
 */
export async function embedDocumentChunks(documentId: string) {
  if (!hasEmbeddingsProvider()) {
    await prisma.document.update({
      where: { id: documentId },
      data: { status: "FAILED", error: DOC_ERRORS.noEmbeddingsKey },
    });
    return;
  }

  const embeddings = getEmbeddings()!;
  const chunks = await prisma.chunk.findMany({
    where: { documentId },
    orderBy: { chunkIndex: "asc" },
    select: { id: true, content: true },
  });

  if (chunks.length === 0) {
    await prisma.document.update({
      where: { id: documentId },
      data: { status: "FAILED", error: DOC_ERRORS.noText },
    });
    return;
  }

  try {
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const vectors = await embeddings.embedDocuments(batch.map((c) => c.content));
      await Promise.all(batch.map((c, idx) => setChunkEmbedding(c.id, vectors[idx])));
    }
    await prisma.document.update({ where: { id: documentId }, data: { status: "READY", error: null } });
  } catch (err) {
    await prisma.document.update({
      where: { id: documentId },
      data: { status: "FAILED", error: err instanceof Error ? err.message : DOC_ERRORS.embedFailed },
    });
  }
}
