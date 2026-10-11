"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import { ChevronDown, MessagesSquare, SquarePen, Trash2 } from "lucide-react";
import { fetcher } from "@/lib/fetcher";
import { createConversation, deleteConversation } from "./actions";
import type { ConversationDTO } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Placeholder title the server gives a conversation until its first question renames it. */
const DEFAULT_TITLE = "New chat";

export function ChatShell({
  children,
  initialConversations,
}: {
  children: React.ReactNode;
  initialConversations: ConversationDTO[];
}) {
  const i18n = useI18n();
  const { t, p } = i18n;
  const params = useParams<{ id?: string }>();
  const router = useRouter();
  const { data: conversations = initialConversations, mutate } = useSWR<ConversationDTO[]>(
    "/api/conversations",
    fetcher,
    { fallbackData: initialConversations, refreshInterval: 10000 }
  );

  const titleOf = (c: ConversationDTO) => (c.title === DEFAULT_TITLE ? t.chat.untitled : c.title);
  const current = conversations.find((c) => c.id === params?.id);

  // A chat created with "New chat" isn't in SWR's cached list yet; fetch the list again right
  // away instead of waiting for the next refresh, so it shows up in the sidebar and menu.
  // (Skipped for a chat that is being deleted, which is missing on purpose.)
  const deleting = React.useRef(new Set<string>());
  const missingCurrent = Boolean(params?.id) && !current;
  React.useEffect(() => {
    if (missingCurrent && params?.id && !deleting.current.has(params.id)) mutate();
  }, [missingCurrent, params?.id, mutate]);

  async function handleDelete(id: string) {
    deleting.current.add(id);
    mutate(
      conversations.filter((c) => c.id !== id),
      false
    );
    try {
      await deleteConversation(id);
      toast.success(t.chat.deleted);
      // Don't leave the user looking at a thread that no longer exists.
      if (id === params?.id) router.push("/chat");
    } catch {
      deleting.current.delete(id);
      toast.error(t.chat.deleteFailed);
    }
    mutate();
  }

  const newChatButton = (
    <form action={createConversation}>
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        aria-label={t.chat.newChat}
        title={t.chat.newChat}
        className="text-link hover:bg-primary-soft"
      >
        <SquarePen className="size-[18px]!" strokeWidth={1.8} />
      </Button>
    </form>
  );

  return (
    <div className="flex h-[calc(100dvh-var(--nav-h))]">
      <aside className="hidden w-[288px] shrink-0 flex-col border-r border-separator bg-background-alt md:flex">
        <div className="flex items-center justify-between py-3 pl-5 pr-3">
          <h2 className="text-[20px] font-bold tracking-headline">{t.chat.conversations}</h2>
          {newChatButton}
        </div>
        <ScrollArea className="flex-1 px-3">
          <ul className="flex flex-col gap-0.5 pb-4">
            {conversations.map((c) => {
              const active = params?.id === c.id;
              return (
                <li key={c.id} className="group relative">
                  <Link
                    href={`/chat/${c.id}`}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex flex-col gap-0.5 rounded-[10px] px-3 py-2.5 pr-10 transition-colors",
                      active ? "bg-primary text-primary-foreground" : "hover:bg-fill"
                    )}
                  >
                    <span className="truncate text-[15px] font-medium leading-snug">{titleOf(c)}</span>
                    <span
                      className={cn("truncate text-[12px]", active ? "text-primary-foreground" : "text-muted")}
                      suppressHydrationWarning
                    >
                      {p(t.chat.messages, c.messageCount)} · {i18n.relative(c.updatedAt)}
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id)}
                    aria-label={t.chat.deleteLabel}
                    title={t.chat.deleteLabel}
                    className={cn(
                      "absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full opacity-0 transition-opacity focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring group-hover:opacity-100 [@media(hover:none)]:opacity-100",
                      active
                        ? "text-primary-foreground/85 hover:bg-white/20"
                        : "text-muted hover:bg-danger-soft hover:text-danger"
                    )}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}
            {conversations.length === 0 && (
              <li className="flex flex-col items-center gap-2 px-3 py-12 text-center">
                <MessagesSquare className="h-6 w-6 text-muted" strokeWidth={1.6} />
                <p className="text-[13px] text-muted">{t.chat.noConversations}</p>
              </li>
            )}
          </ul>
        </ScrollArea>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* On small screens the sidebar becomes a menu in a slim bar above the thread. */}
        <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-separator px-2 md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={t.chat.showConversations}
                className="flex min-w-0 items-center gap-1 rounded-full px-3 py-1.5 text-[15px] font-semibold hover:bg-fill focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring"
              >
                <span className="truncate">{current ? titleOf(current) : t.chat.conversations}</span>
                <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-[60dvh] w-[min(20rem,calc(100vw-1.5rem))] overflow-y-auto">
              <DropdownMenuLabel>{t.chat.conversations}</DropdownMenuLabel>
              {conversations.map((c) => (
                <DropdownMenuItem key={c.id} asChild className={cn(c.id === params?.id && "font-semibold")}>
                  <Link href={`/chat/${c.id}`} aria-current={c.id === params?.id ? "page" : undefined}>
                    <span className="truncate">{titleOf(c)}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
              {conversations.length === 0 && (
                <p className="px-2.5 py-2 text-[13px] text-muted">{t.chat.noConversations}</p>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          {newChatButton}
        </div>
        <div className="min-h-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
