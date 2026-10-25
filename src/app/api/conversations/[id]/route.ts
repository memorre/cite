import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getI18n } from "@/i18n/server";
import { countReadyDocuments, getConversationForOwner, listMessages } from "@/lib/data";
import { deleteConversationForOwner } from "@/lib/mutations";
import { getChatProvider } from "@/lib/llm";

/** A conversation with its messages (oldest first) and the flags the chat page shows banners for. */
export async function GET(_request: Request, { params }: RouteContext<"/api/conversations/[id]">) {
  const [session, { t }] = await Promise.all([auth(), getI18n()]);
  if (!session?.user) return NextResponse.json({ error: t.api.unauthorized }, { status: 401 });

  const { id } = await params;
  const conversation = await getConversationForOwner(id, session.user.id);
  if (!conversation) return NextResponse.json({ error: t.api.conversationNotFound }, { status: 404 });

  const [messages, readyCount] = await Promise.all([
    listMessages(conversation.id),
    countReadyDocuments(session.user.id),
  ]);

  return NextResponse.json({
    conversation: {
      id: conversation.id,
      title: conversation.title,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
    },
    messages,
    hasReadyDocuments: readyCount > 0,
    chatProvider: getChatProvider(),
  });
}

export async function DELETE(_request: Request, { params }: RouteContext<"/api/conversations/[id]">) {
  const [session, { t }] = await Promise.all([auth(), getI18n()]);
  if (!session?.user) return NextResponse.json({ error: t.api.unauthorized }, { status: 401 });

  const { id } = await params;
  const deleted = await deleteConversationForOwner(id, session.user.id);
  if (!deleted) return NextResponse.json({ error: t.api.conversationNotFound }, { status: 404 });
  return NextResponse.json({ ok: true });
}
