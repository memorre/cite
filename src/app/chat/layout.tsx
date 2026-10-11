import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { listConversationsForUser } from "@/lib/data";
import { getI18n } from "@/i18n/server";
import { ChatShell } from "./chat-shell";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.meta.chat };
}

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const conversations = await listConversationsForUser(user.id);

  return <ChatShell initialConversations={conversations}>{children}</ChatShell>;
}
