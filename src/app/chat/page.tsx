import { redirect } from "next/navigation";
import { MessagesSquare } from "lucide-react";
import { requireUser } from "@/lib/session";
import { listConversationsForUser } from "@/lib/data";
import { createConversation } from "./actions";
import { Button } from "@/components/ui/button";

export default async function ChatIndexPage() {
  const user = await requireUser();
  const conversations = await listConversationsForUser(user.id);
  if (conversations.length > 0) redirect(`/chat/${conversations[0].id}`);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
        <MessagesSquare className="h-6 w-6" />
      </span>
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Start a conversation</h1>
        <p className="mt-1 max-w-sm text-sm text-muted">
          Ask a question and Cite will search across every document in your library.
        </p>
      </div>
      <form action={createConversation}>
        <Button type="submit">New chat</Button>
      </form>
    </div>
  );
}
