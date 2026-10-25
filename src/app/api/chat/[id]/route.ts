import { NextResponse } from "next/server";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UNTITLED_CONVERSATION } from "@/lib/data";
import { answerQuestion } from "@/lib/rag";
import { getChatProvider, hasEmbeddingsProvider } from "@/lib/llm";
import { getI18n } from "@/i18n/server";

export const maxDuration = 60;

export async function POST(request: Request, { params }: RouteContext<"/api/chat/[id]">) {
  const [session, { t, f }] = await Promise.all([auth(), getI18n()]);
  if (!session?.user) return NextResponse.json({ error: t.api.unauthorized }, { status: 401 });

  const { id } = await params;
  const conversation = await prisma.conversation.findFirst({ where: { id, ownerId: session.user.id } });
  if (!conversation) return NextResponse.json({ error: t.api.conversationNotFound }, { status: 404 });

  const body = await request.json().catch(() => null);
  const message = body?.message;
  if (typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: t.api.messageRequired }, { status: 400 });
  }

  // answerQuestion() needs both an embeddings key and a chat model; say so in the user's language.
  if (!hasEmbeddingsProvider() || !getChatProvider()) {
    return NextResponse.json({ error: t.api.noProvider }, { status: 503 });
  }

  const readyDocs = await prisma.document.findMany({
    where: { ownerId: session.user.id, status: "READY" },
    select: { id: true },
  });
  const documentIds = readyDocs.map((d) => d.id);

  if (documentIds.length === 0) {
    return NextResponse.json({ error: t.api.noReadyDocs }, { status: 400 });
  }

  const priorMessages = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
  });
  const history = priorMessages.map((m) => (m.role === "USER" ? new HumanMessage(m.content) : new AIMessage(m.content)));

  await prisma.message.create({ data: { conversationId: conversation.id, role: "USER", content: message } });

  let result;
  try {
    result = await answerQuestion({ question: message, documentIds, history });
  } catch (err) {
    // Provider errors arrive in English; wrap them in a sentence in the user's language and keep the detail.
    const error = err instanceof Error && err.message ? f(t.api.llmErrorDetail, { message: err.message }) : t.api.llmError;
    return NextResponse.json({ error }, { status: 500 });
  }

  const encoder = new TextEncoder();
  let full = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of result.stream) {
          const text = typeof chunk.content === "string" ? chunk.content : "";
          if (text) {
            full += text;
            controller.enqueue(encoder.encode(text));
          }
        }
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            role: "ASSISTANT",
            content: full,
            citations: result.citations,
          },
        });
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: conversation.title === UNTITLED_CONVERSATION ? { title: message.slice(0, 60) } : { updatedAt: new Date() },
        });
        controller.enqueue(encoder.encode(`\n\n<<CITATIONS>>${JSON.stringify(result.citations)}`));
      } catch (err) {
        const detail = f(t.api.streamError, { message: err instanceof Error ? err.message : t.api.llmError });
        controller.enqueue(encoder.encode(`\n\n[${detail}]`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      // Without this, clients that sniff content types (Apple's URLSession
      // holds back the first 512 bytes) show a short answer only at the end.
      "X-Content-Type-Options": "nosniff",
    },
  });
}
