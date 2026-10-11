import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { extractPdfPages } from "@/lib/pdf";
import { chunkPages } from "@/lib/chunk";
import { embedDocumentChunks } from "@/lib/ingest";
import { DOC_ERRORS } from "@/lib/doc-errors";
import { getI18n } from "@/i18n/server";

// Give PDF parsing + embedding room to run past Vercel's 10s Hobby default.
export const maxDuration = 60;

const MAX_FILE_BYTES = 4 * 1024 * 1024; // 4MB

export async function POST(request: Request) {
  const [session, { t }] = await Promise.all([auth(), getI18n()]);
  if (!session?.user) return NextResponse.json({ error: t.api.unauthorized }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: t.upload.errors.chooseFile }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: t.upload.errors.onlyPdf }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: t.upload.errors.tooLarge }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const document = await prisma.document.create({
    data: {
      ownerId: session.user.id,
      title: file.name.replace(/\.pdf$/i, ""),
      filename: file.name,
      status: "PROCESSING",
    },
  });

  try {
    const pages = await extractPdfPages(buffer);
    const chunks = await chunkPages(pages);

    if (chunks.length === 0) {
      await prisma.document.update({
        where: { id: document.id },
        data: {
          status: "FAILED",
          error: DOC_ERRORS.noTextScanned,
        },
      });
      return NextResponse.json({ error: t.upload.errors.noText }, { status: 422 });
    }

    await prisma.chunk.createMany({
      data: chunks.map((c) => ({
        documentId: document.id,
        content: c.content,
        page: c.page,
        chunkIndex: c.chunkIndex,
      })),
    });
    await prisma.document.update({ where: { id: document.id }, data: { pageCount: pages.length } });

    // Parsing and chunking above don't need an LLM key and have already been
    // persisted. Embedding does need one — if it's missing or the call
    // fails, this only marks the document FAILED with a clear reason;
    // the "Retry" action re-runs just this step once a key is available.
    await embedDocumentChunks(document.id);
  } catch (err) {
    await prisma.document.update({
      where: { id: document.id },
      data: { status: "FAILED", error: err instanceof Error ? err.message : DOC_ERRORS.processFailed },
    });
  }

  return NextResponse.json({ success: true, documentId: document.id });
}
