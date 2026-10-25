"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { createConversationForOwner, deleteConversationForOwner } from "@/lib/mutations";

export async function createConversation() {
  const user = await requireUser();
  const conversation = await createConversationForOwner(user.id);
  redirect(`/chat/${conversation.id}`);
}

export async function deleteConversation(conversationId: string) {
  const user = await requireUser();
  await deleteConversationForOwner(conversationId, user.id);
  revalidatePath("/chat");
}
