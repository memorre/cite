import { requireUser } from "@/lib/session";
import { listConversationsForUser } from "@/lib/data";
import { ChatShell } from "./chat-shell";

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const conversations = await listConversationsForUser(user.id);

  return <ChatShell initialConversations={conversations}>{children}</ChatShell>;
}
