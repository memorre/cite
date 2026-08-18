"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { embedDocumentChunks } from "@/lib/ingest";

export async function retryEmbedding(documentId: string) {
  const user = await requireUser();
  const doc = await prisma.document.findFirst({ where: { id: documentId, ownerId: user.id } });
  if (!doc) return;
  await prisma.document.update({ where: { id: doc.id }, data: { status: "PROCESSING", error: null } });
  await embedDocumentChunks(doc.id);
  revalidatePath("/library");
}

export async function deleteDocument(documentId: string) {
  const user = await requireUser();
  await prisma.document.deleteMany({ where: { id: documentId, ownerId: user.id } });
  revalidatePath("/library");
}
