import { redirect } from "next/navigation";
import { MessagesSquare } from "lucide-react";
import { requireUser } from "@/lib/session";
import { listConversationsForUser } from "@/lib/data";
import { getI18n } from "@/i18n/server";
import { createConversation } from "./actions";
import { Button } from "@/components/ui/button";

export default async function ChatIndexPage() {
  const user = await requireUser();
  const conversations = await listConversationsForUser(user.id);
  if (conversations.length > 0) redirect(`/chat/${conversations[0].id}`);
  const { t } = await getI18n();

  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-link">
        <MessagesSquare className="h-7 w-7" strokeWidth={1.6} />
      </span>
      <div>
        <h1 className="text-[28px] font-semibold leading-tight tracking-headline">{t.chat.startTitle}</h1>
        <p className="mx-auto mt-2 max-w-sm text-[17px] text-muted">{t.chat.startBody}</p>
      </div>
      <form action={createConversation}>
        <Button type="submit" size="lg">
          {t.chat.newChat}
        </Button>
      </form>
    </div>
  );
}
