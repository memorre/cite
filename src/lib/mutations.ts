// Writes shared by the web app's server actions and the JSON route handlers the native app uses.
// Every function is scoped to an owner, so callers only need to pass the signed-in user's id.
import { prisma } from "@/lib/prisma";
import { embedDocumentChunks } from "@/lib/ingest";
import { UNTITLED_CONVERSATION, getDocumentDTOForOwner, toConversationDTO } from "@/lib/data";

export async function createConversationForOwner(ownerId: string) {
  const conversation = await prisma.conversation.create({
    data: { ownerId, title: UNTITLED_CONVERSATION },
    include: { _count: { select: { messages: true } } },
  });
  return toConversationDTO(conversation);
}

/** Deletes the conversation and (by cascade) its messages. Returns false if there was nothing to delete. */
export async function deleteConversationForOwner(conversationId: string, ownerId: string) {
  const { count } = await prisma.conversation.deleteMany({ where: { id: conversationId, ownerId } });
  return count > 0;
}

/** Deletes the document and (by cascade) its passages. Returns false if there was nothing to delete. */
export async function deleteDocumentForOwner(documentId: string, ownerId: string) {
  const { count } = await prisma.document.deleteMany({ where: { id: documentId, ownerId } });
  return count > 0;
}

/**
 * Runs the embedding step again and returns the document as it ends up: READY, FAILED with a
 * reason, or still PROCESSING if this run was cut off too. Only passages without a vector are sent
 * (see embedDocumentChunks), so each retry of a large document stuck PROCESSING after a timed-out
 * upload continues where the last run stopped. Null when the document isn't the owner's.
 * It doesn't check the current status, because a stuck document looks exactly like one that is
 * still being embedded (there is no updatedAt); a run overlapping another one only re-sends the
 * passages both still see as missing, and neither marks the document READY before all have vectors.
 */
export async function retryDocumentEmbedding(documentId: string, ownerId: string) {
  const doc = await prisma.document.findFirst({ where: { id: documentId, ownerId }, select: { id: true } });
  if (!doc) return null;
  await prisma.document.update({ where: { id: doc.id }, data: { status: "PROCESSING", error: null } });
  await embedDocumentChunks(doc.id);
  return getDocumentDTOForOwner(doc.id, ownerId);
}
