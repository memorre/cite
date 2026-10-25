import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getI18n } from "@/i18n/server";
import { getChunkForOwner } from "@/lib/data";

/**
 * The full text of one indexed passage. A citation only carries the passage's first 240
 * characters (and, from now on, its chunkId), so clients fetch the rest here.
 */
export async function GET(_request: Request, { params }: RouteContext<"/api/chunks/[id]">) {
  const [session, { t }] = await Promise.all([auth(), getI18n()]);
  if (!session?.user) return NextResponse.json({ error: t.api.unauthorized }, { status: 401 });

  const { id } = await params;
  const chunk = await getChunkForOwner(id, session.user.id);
  if (!chunk) return NextResponse.json({ error: t.api.passageNotFound }, { status: 404 });
  return NextResponse.json(chunk);
}
