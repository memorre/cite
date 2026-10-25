import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getI18n } from "@/i18n/server";
import { getDocumentDTOForOwner } from "@/lib/data";
import { deleteDocumentForOwner } from "@/lib/mutations";

/** One document, e.g. to follow a single upload while it is processing. */
export async function GET(_request: Request, { params }: RouteContext<"/api/documents/[id]">) {
  const [session, { t }] = await Promise.all([auth(), getI18n()]);
  if (!session?.user) return NextResponse.json({ error: t.api.unauthorized }, { status: 401 });

  const { id } = await params;
  const document = await getDocumentDTOForOwner(id, session.user.id);
  if (!document) return NextResponse.json({ error: t.api.documentNotFound }, { status: 404 });
  return NextResponse.json(document);
}

/** Deletes the document and its indexed passages. */
export async function DELETE(_request: Request, { params }: RouteContext<"/api/documents/[id]">) {
  const [session, { t }] = await Promise.all([auth(), getI18n()]);
  if (!session?.user) return NextResponse.json({ error: t.api.unauthorized }, { status: 401 });

  const { id } = await params;
  const deleted = await deleteDocumentForOwner(id, session.user.id);
  if (!deleted) return NextResponse.json({ error: t.api.documentNotFound }, { status: 404 });
  return NextResponse.json({ ok: true });
}
