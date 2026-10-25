import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getI18n } from "@/i18n/server";
import { countReadyDocuments } from "@/lib/data";
import { getChatProvider, hasEmbeddingsProvider } from "@/lib/llm";

/**
 * The signed-in user plus what the server can do for them: the flags the library and chat pages
 * compute on the server (for their "no API key" and "no documents" banners), for clients that
 * don't render those pages.
 */
export async function GET() {
  const [session, { t }] = await Promise.all([auth(), getI18n()]);
  if (!session?.user) return NextResponse.json({ error: t.api.unauthorized }, { status: 401 });

  const { id, name, email } = session.user;
  return NextResponse.json({
    user: { id, name, email },
    hasEmbeddings: hasEmbeddingsProvider(),
    chatProvider: getChatProvider(),
    readyDocumentCount: await countReadyDocuments(id),
  });
}
