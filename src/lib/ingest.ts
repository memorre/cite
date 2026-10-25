import { prisma } from "@/lib/prisma";
import { getEmbeddings, hasEmbeddingsProvider } from "@/lib/llm";
import { setChunkEmbedding } from "@/lib/vector";
import { DOC_ERRORS, EMBED_DETAIL_SEPARATOR } from "@/lib/doc-errors";

const BATCH_SIZE = 50;

/**
 * Embeds every not-yet-embedded chunk for a document and flips its status.
 * Safe to call more than once: already-embedded chunks aren't re-sent, and each batch is saved as
 * soon as it's embedded, so a run cut off by the function time limit leaves its progress behind
 * and the next run (a retry) picks up from there instead of starting over.
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
  // `embedding` is an Unsupported() column, so Prisma's query API can't filter on it.
  const chunks = await prisma.$queryRaw<{ id: string; content: string }[]>`
    SELECT id, content FROM "Chunk"
    WHERE "documentId" = ${documentId} AND embedding IS NULL
    ORDER BY "chunkIndex" ASC
  `;

  if (chunks.length === 0 && (await prisma.chunk.count({ where: { documentId } })) === 0) {
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
    // READY only once every passage has a vector, so a run that overlapped another one can't
    // mark the document READY while passages are still missing.
    const [{ missing }] = await prisma.$queryRaw<{ missing: number }[]>`
      SELECT COUNT(*)::int AS missing FROM "Chunk" WHERE "documentId" = ${documentId} AND embedding IS NULL
    `;
    if (missing === 0) {
      await prisma.document.update({ where: { id: documentId }, data: { status: "READY", error: null } });
    }
  } catch (err) {
    console.error(err);
    // Keep the provider's message (often the actionable part, e.g. an invalid key) behind a known
    // prefix, so the library can put a translated lead-in in front of it.
    const detail = err instanceof Error ? err.message.trim() : "";
    await prisma.document.update({
      where: { id: documentId },
      data: { status: "FAILED", error: detail ? `${DOC_ERRORS.embedFailed}${EMBED_DETAIL_SEPARATOR}${detail}` : DOC_ERRORS.embedFailed },
    });
  }
}
