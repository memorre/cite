import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getI18n } from "@/i18n/server";
import { retryDocumentEmbedding } from "@/lib/mutations";

// Embedding a whole document can take as long as the upload did.
export const maxDuration = 60;

/**
 * Re-runs embedding for a FAILED document, or one stuck in PROCESSING after a timed-out upload,
 * and answers with the document as it ends up (READY, or FAILED with a reason). Passages embedded
 * by earlier runs are kept, so if this run hits the time limit too, the next retry goes further.
 */
export async function POST(_request: Request, { params }: RouteContext<"/api/documents/[id]/retry">) {
  const [session, { t }] = await Promise.all([auth(), getI18n()]);
  if (!session?.user) return NextResponse.json({ error: t.api.unauthorized }, { status: 401 });

  const { id } = await params;
  const document = await retryDocumentEmbedding(id, session.user.id);
  if (!document) return NextResponse.json({ error: t.api.documentNotFound }, { status: 404 });
  return NextResponse.json(document);
}
