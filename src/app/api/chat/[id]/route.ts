import { NextResponse } from "next/server";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { answerQuestion } from "@/lib/rag";

export const maxDuration = 60;

export async function POST(request: Request, { params }: RouteContext<"/api/chat/[id]">) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const conversation = await prisma.conversation.findFirst({ where: { id, ownerId: session.user.id } });
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const message = body?.message;
  if (typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const readyDocs = await prisma.document.findMany({
    where: { ownerId: session.user.id, status: "READY" },
    select: { id: true },
  });
  const documentIds = readyDocs.map((d) => d.id);

  if (documentIds.length === 0) {
    return NextResponse.json({ error: "No ready documents to search yet — upload a PDF first." }, { status: 400 });
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
    return NextResponse.json({ error: err instanceof Error ? err.message : "LLM error" }, { status: 500 });
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
          data: conversation.title === "New chat" ? { title: message.slice(0, 60) } : { updatedAt: new Date() },
        });
        controller.enqueue(encoder.encode(`\n\n<<CITATIONS>>${JSON.stringify(result.citations)}`));
      } catch (err) {
        controller.enqueue(encoder.encode(`\n\n[Error: ${err instanceof Error ? err.message : "stream failed"}]`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
