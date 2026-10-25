import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { countReadyDocuments, getConversationForOwner, listMessages } from "@/lib/data";
import { getChatProvider } from "@/lib/llm";
import { getI18n } from "@/i18n/server";
import { ChatClient } from "./chat-client";

/** One lookup per request, shared by generateMetadata and the page. */
const getConversation = cache(getConversationForOwner);

export async function generateMetadata({ params }: PageProps<"/chat/[id]">): Promise<Metadata> {
  const [user, { id }, { t }] = await Promise.all([requireUser(), params, getI18n()]);
  const conversation = await getConversation(id, user.id);
  // Keep the chat layout's title, except on the not-found page, which would otherwise be titled "Chat".
  // The chat layout's plain-string title stops the root "%s · Cite" template here, so add the suffix.
  return conversation ? {} : { title: { absolute: `${t.meta.notFound} · Cite` } };
}

export default async function ConversationPage({ params }: PageProps<"/chat/[id]">) {
  const user = await requireUser();
  const { id } = await params;

  const conversation = await getConversation(id, user.id);
  if (!conversation) notFound();

  const [messages, readyDocCount] = await Promise.all([listMessages(conversation.id), countReadyDocuments(user.id)]);

  return (
    <ChatClient
      conversationId={conversation.id}
      initialMessages={messages}
      hasReadyDocuments={readyDocCount > 0}
      chatProvider={getChatProvider()}
    />
  );
}
