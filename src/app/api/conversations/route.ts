import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listConversationsForUser } from "@/lib/data";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const conversations = await listConversationsForUser(session.user.id);
  return NextResponse.json(conversations);
}
