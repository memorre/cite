import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listDocumentsForUser } from "@/lib/data";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const documents = await listDocumentsForUser(session.user.id);
  return NextResponse.json(documents);
}
