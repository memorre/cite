import { prisma } from "@/lib/prisma";
import type { Citation } from "@/lib/rag";
import type { Conversation, Document, Message } from "@/generated/prisma/client";

/**
 * Placeholder title a conversation gets at creation. The first answered question renames it, and
 * clients show their own localized "New chat" while it is still this value.
 */
export const UNTITLED_CONVERSATION = "New chat";

type DocumentWithChunkCount = Document & { _count: { chunks: number } };

/** The JSON shape of a document, shared by the list and single-document routes and the library page. */
export function toDocumentDTO(d: DocumentWithChunkCount) {
  return {
    id: d.id,
    title: d.title,
    filename: d.filename,
    pageCount: d.pageCount,
    status: d.status,
    error: d.error,
    chunkCount: d._count.chunks,
    createdAt: d.createdAt.toISOString(),
  };
}

export type DocumentDTO = ReturnType<typeof toDocumentDTO>;

export async function listDocumentsForUser(userId: string): Promise<DocumentDTO[]> {
  const docs = await prisma.document.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { chunks: true } } },
  });

  return docs.map(toDocumentDTO);
}

export async function getDocumentForOwner(documentId: string, ownerId: string) {
  return prisma.document.findFirst({ where: { id: documentId, ownerId } });
}

/** One of the owner's documents as a DTO, or null when it doesn't exist or belongs to someone else. */
export async function getDocumentDTOForOwner(documentId: string, ownerId: string): Promise<DocumentDTO | null> {
  const doc = await prisma.document.findFirst({
    where: { id: documentId, ownerId },
    include: { _count: { select: { chunks: true } } },
  });
  return doc ? toDocumentDTO(doc) : null;
}

export async function countReadyDocuments(ownerId: string) {
  return prisma.document.count({ where: { ownerId, status: "READY" } });
}

type ConversationWithMessageCount = Conversation & { _count: { messages: number } };

export function toConversationDTO(c: ConversationWithMessageCount) {
  return {
    id: c.id,
    title: c.title,
    messageCount: c._count.messages,
    updatedAt: c.updatedAt.toISOString(),
  };
}

export type ConversationDTO = ReturnType<typeof toConversationDTO>;

export async function listConversationsForUser(userId: string): Promise<ConversationDTO[]> {
  const conversations = await prisma.conversation.findMany({
    where: { ownerId: userId },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { messages: true } } },
  });
  return conversations.map(toConversationDTO);
}

export async function getConversationForOwner(conversationId: string, ownerId: string) {
  return prisma.conversation.findFirst({ where: { id: conversationId, ownerId } });
}

/** A message as the chat thread shows it. `citations` is null for questions. */
export function toMessageDTO(m: Message) {
  return {
    id: m.id,
    role: m.role,
    content: m.content,
    // Stored as Json; written only by the chat route, always as Citation[].
    citations: (m.citations as unknown as Citation[] | null) ?? null,
    createdAt: m.createdAt.toISOString(),
  };
}

export type MessageDTO = ReturnType<typeof toMessageDTO>;

/** A conversation's messages, oldest first. Callers check ownership first. */
export async function listMessages(conversationId: string): Promise<MessageDTO[]> {
  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });
  return messages.map(toMessageDTO);
}

/** One indexed passage of the owner's documents (what a citation points at), or null. */
export async function getChunkForOwner(chunkId: string, ownerId: string) {
  const chunk = await prisma.chunk.findFirst({
    where: { id: chunkId, document: { ownerId } },
    select: {
      id: true,
      documentId: true,
      chunkIndex: true,
      page: true,
      content: true,
      document: { select: { title: true } },
    },
  });
  if (!chunk) return null;
  return {
    id: chunk.id,
    documentId: chunk.documentId,
    documentTitle: chunk.document.title,
    chunkIndex: chunk.chunkIndex,
    page: chunk.page,
    content: chunk.content,
  };
}
