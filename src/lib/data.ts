import { prisma } from "@/lib/prisma";

export async function listDocumentsForUser(userId: string) {
  const docs = await prisma.document.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { chunks: true } } },
  });

  return docs.map((d) => ({
    id: d.id,
    title: d.title,
    filename: d.filename,
    pageCount: d.pageCount,
    status: d.status,
    error: d.error,
    chunkCount: d._count.chunks,
    createdAt: d.createdAt.toISOString(),
  }));
}

export type DocumentDTO = Awaited<ReturnType<typeof listDocumentsForUser>>[number];

export async function getDocumentForOwner(documentId: string, ownerId: string) {
  return prisma.document.findFirst({ where: { id: documentId, ownerId } });
}

export async function listConversationsForUser(userId: string) {
  const conversations = await prisma.conversation.findMany({
    where: { ownerId: userId },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { messages: true } } },
  });
  return conversations.map((c) => ({
    id: c.id,
    title: c.title,
    messageCount: c._count.messages,
    updatedAt: c.updatedAt.toISOString(),
  }));
}

export type ConversationDTO = Awaited<ReturnType<typeof listConversationsForUser>>[number];
