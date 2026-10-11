import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getI18n } from "@/i18n/server";
import { listDocumentsForUser } from "@/lib/data";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    const { t } = await getI18n();
    return NextResponse.json({ error: t.api.unauthorized }, { status: 401 });
  }

  const documents = await listDocumentsForUser(session.user.id);
  return NextResponse.json(documents);
}
