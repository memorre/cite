import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getChatProvider } from "@/lib/llm";
import { ChatClient } from "./chat-client";

export default async function ConversationPage({ params }: PageProps<"/chat/[id]">) {
  const user = await requireUser();
  const { id } = await params;

  const conversation = await prisma.conversation.findFirst({ where: { id, ownerId: user.id } });
  if (!conversation) notFound();

  const messages = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
  });

  const readyDocCount = await prisma.document.count({ where: { ownerId: user.id, status: "READY" } });

  return (
    <ChatClient
      conversationId={conversation.id}
      initialMessages={messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        citations: (m.citations as unknown as
          | { index: number; documentId: string; documentTitle: string; page: number | null; snippet: string }[]
          | null) ?? null,
      }))}
      hasReadyDocuments={readyDocCount > 0}
      chatProvider={getChatProvider()}
    />
  );
}
