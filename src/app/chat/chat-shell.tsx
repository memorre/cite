"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { MessageSquarePlus, MessagesSquare, Trash2 } from "lucide-react";
import { fetcher } from "@/lib/fetcher";
import { createConversation, deleteConversation } from "./actions";
import type { ConversationDTO } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export function ChatShell({
  children,
  initialConversations,
}: {
  children: React.ReactNode;
  initialConversations: ConversationDTO[];
}) {
  const params = useParams<{ id?: string }>();
  const { data: conversations = initialConversations, mutate } = useSWR<ConversationDTO[]>(
    "/api/conversations",
    fetcher,
    { fallbackData: initialConversations, refreshInterval: 10000 }
  );

  async function handleDelete(id: string) {
    mutate(
      conversations.filter((c) => c.id !== id),
      false
    );
    await deleteConversation(id);
    toast.success("Conversation deleted");
    mutate();
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-6xl">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border md:flex">
        <div className="p-3">
          <form action={createConversation}>
            <Button type="submit" className="w-full" size="sm">
              <MessageSquarePlus className="h-3.5 w-3.5" /> New chat
            </Button>
          </form>
        </div>
        <ScrollArea className="flex-1 px-2">
          <div className="flex flex-col gap-1 pb-4">
            {conversations.map((c) => (
              <div key={c.id} className="group relative">
                <Link
                  href={`/chat/${c.id}`}
                  className={cn(
                    "flex flex-col gap-0.5 rounded-xl px-3 py-2 pr-8 transition-colors",
                    params?.id === c.id ? "bg-primary-soft text-primary" : "hover:bg-surface-2"
                  )}
                >
                  <span className="truncate text-sm font-medium">{c.title}</span>
                  <span className="text-[11px] text-muted">
                    {c.messageCount} messages · {formatDistanceToNow(new Date(c.updatedAt), { addSuffix: true })}
                  </span>
                </Link>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                  aria-label="Delete conversation"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {conversations.length === 0 && (
              <div className="flex flex-col items-center gap-2 px-3 py-10 text-center">
                <MessagesSquare className="h-6 w-6 text-muted" />
                <p className="text-xs text-muted">No chats yet</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </aside>

      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
