"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { deleteDocumentForOwner, retryDocumentEmbedding } from "@/lib/mutations";

export async function retryEmbedding(documentId: string) {
  const user = await requireUser();
  await retryDocumentEmbedding(documentId, user.id);
  revalidatePath("/library");
}

export async function deleteDocument(documentId: string) {
  const user = await requireUser();
  await deleteDocumentForOwner(documentId, user.id);
  revalidatePath("/library");
}
