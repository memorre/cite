"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function createConversation() {
  const user = await requireUser();
  const conversation = await prisma.conversation.create({
    data: { ownerId: user.id, title: "New chat" },
  });
  redirect(`/chat/${conversation.id}`);
}

export async function deleteConversation(conversationId: string) {
  const user = await requireUser();
  await prisma.conversation.deleteMany({ where: { id: conversationId, ownerId: user.id } });
  revalidatePath("/chat");
}
