import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getI18n } from "@/i18n/server";
import { listConversationsForUser } from "@/lib/data";
import { createConversationForOwner } from "@/lib/mutations";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    const { t } = await getI18n();
    return NextResponse.json({ error: t.api.unauthorized }, { status: 401 });
  }

  const conversations = await listConversationsForUser(session.user.id);
  return NextResponse.json(conversations);
}

/** Starts an empty, untitled conversation (the web's "New chat" action, without the redirect). */
export async function POST() {
  const session = await auth();
  if (!session?.user) {
    const { t } = await getI18n();
    return NextResponse.json({ error: t.api.unauthorized }, { status: 401 });
  }

  const conversation = await createConversationForOwner(session.user.id);
  return NextResponse.json(conversation, { status: 201 });
}
