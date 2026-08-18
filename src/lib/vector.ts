import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const EMBEDDING_DIMENSIONS = 1536; // text-embedding-3-small

/** pgvector's text input format: "[0.1,0.2,...]" */
function toVectorLiteral(embedding: number[]) {
  return `[${embedding.join(",")}]`;
}

export async function setChunkEmbedding(chunkId: string, embedding: number[]) {
  await prisma.$executeRaw`
    UPDATE "Chunk" SET embedding = ${toVectorLiteral(embedding)}::vector WHERE id = ${chunkId}
  `;
}

export type SimilarChunk = {
  id: string;
  documentId: string;
  content: string;
  page: number | null;
  distance: number;
  documentTitle: string;
};

/** Cosine-distance nearest-neighbour search, scoped to a set of documents (already ownership-checked by the caller). */
export async function searchSimilarChunks(
  documentIds: string[],
  queryEmbedding: number[],
  limit = 6
): Promise<SimilarChunk[]> {
  if (documentIds.length === 0) return [];

  return prisma.$queryRaw<SimilarChunk[]>`
    SELECT
      c.id,
      c."documentId",
      c.content,
      c.page,
      (c.embedding <=> ${toVectorLiteral(queryEmbedding)}::vector) AS distance,
      d.title AS "documentTitle"
    FROM "Chunk" c
    JOIN "Document" d ON d.id = c."documentId"
    WHERE c."documentId" IN (${Prisma.join(documentIds)})
      AND c.embedding IS NOT NULL
    ORDER BY distance ASC
    LIMIT ${limit}
  `;
}
