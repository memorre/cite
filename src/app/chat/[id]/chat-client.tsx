"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { ArrowUp, FileText, KeyRound, Quote } from "lucide-react";
import type { ChatProvider } from "@/lib/llm";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/client";
import { CitationText } from "@/components/citation-text";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

type Citation = { index: number; documentId: string; documentTitle: string; page: number | null; snippet: string };
type ChatMessage = { id: string; role: "USER" | "ASSISTANT"; content: string; citations: Citation[] | null };

const CITATIONS_MARKER = "\n\n<<CITATIONS>>";

/** An error whose message came from our API and is already in the user's language. */
class ApiError extends Error {}

/** What the screen-reader status region says: nothing, "searching…", or the finished answer. */
type Announcement = { kind: "thinking" } | { kind: "answer"; text: string } | null;

/** The answer as it should be read aloud: without the [1]-style citation markers. */
function spokenAnswer(text: string) {
  return text.replace(/\s?\[\d{1,2}\]/g, "").trim();
}

export function ChatClient({
  conversationId,
  initialMessages,
  hasReadyDocuments,
  chatProvider,
}: {
  conversationId: string;
  initialMessages: ChatMessage[];
  hasReadyDocuments: boolean;
  chatProvider: ChatProvider;
}) {
  const { t, f } = useI18n();
  const { mutate } = useSWRConfig();
  const [messages, setMessages] = React.useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = React.useState("");
  const [streaming, setStreaming] = React.useState(false);
  const [streamingText, setStreamingText] = React.useState("");
  const [announcement, setAnnouncement] = React.useState<Announcement>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const inputId = React.useId();

  React.useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    bottomRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "end" });
  }, [messages, streamingText]);

  const disabled = streaming || !hasReadyDocuments || !chatProvider;

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question || disabled) return;

    setInput("");
    setMessages((prev) => [...prev, { id: `tmp-user-${Date.now()}`, role: "USER", content: question, citations: null }]);
    setStreaming(true);
    setStreamingText("");
    setAnnouncement({ kind: "thinking" });

    try {
      const res = await fetch(`/api/chat/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question }),
      });

      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}));
        throw typeof body.error === "string" ? new ApiError(body.error) : new Error();
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        const marker = full.indexOf(CITATIONS_MARKER);
        setStreamingText(marker === -1 ? full : full.slice(0, marker));
      }

      const marker = full.indexOf(CITATIONS_MARKER);
      const text = marker === -1 ? full : full.slice(0, marker);
      let citations: Citation[] = [];
      if (marker !== -1) {
        try {
          citations = JSON.parse(full.slice(marker + CITATIONS_MARKER.length));
        } catch {
          citations = [];
        }
      }

      setMessages((prev) => [...prev, { id: `tmp-assistant-${Date.now()}`, role: "ASSISTANT", content: text, citations }]);
      setAnnouncement({ kind: "answer", text: spokenAnswer(text) });
    } catch (err) {
      // The toast announces the error itself.
      setAnnouncement(null);
      toast.error(err instanceof ApiError && err.message ? err.message : t.chat.errorFailed);
    } finally {
      setStreaming(false);
      setStreamingText("");
      // The first question renames the chat and the message count changed: refresh the chat list now.
      mutate("/api/conversations");
    }
  }

  const placeholder = !chatProvider
    ? t.chat.placeholderNoKey
    : !hasReadyDocuments
      ? t.chat.placeholderNoDocs
      : t.chat.placeholder;

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto flex max-w-[720px] flex-col gap-6 px-4 py-8 sm:px-6">
          {!chatProvider && <Banner icon={KeyRound} text={t.chat.noKeyBanner} />}
          {chatProvider && !hasReadyDocuments && (
            <Banner
              icon={FileText}
              text={t.chat.noDocsBanner}
              action={
                <Link href="/library" className="link-more text-[13px]">
                  {t.chat.goToLibrary}
                </Link>
              }
            />
          )}

          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.article
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                aria-label={m.role === "USER" ? t.chat.you : "Cite"}
                className={cn("flex", m.role === "USER" ? "justify-end" : "justify-start")}
              >
                {m.role === "USER" ? (
                  <p className="max-w-[85%] rounded-[20px] rounded-br-[6px] bg-primary px-4 py-2.5 text-[15px] leading-[1.45] whitespace-pre-wrap text-primary-foreground [overflow-wrap:anywhere]">
                    {m.content}
                  </p>
                ) : (
                  <div className="flex w-full max-w-[92%] flex-col gap-2.5">
                    <p className="w-fit max-w-full rounded-[20px] rounded-bl-[6px] bg-bubble px-4 py-2.5 text-[15px] leading-[1.5] whitespace-pre-wrap [overflow-wrap:anywhere]">
                      <CitationText text={m.content} label={t.chat.citation} />
                    </p>
                    {m.citations && m.citations.length > 0 && (
                      <section aria-label={t.chat.sources} className="flex flex-col gap-1.5">
                        <h3 className="px-1 text-[12px] font-medium text-muted">{t.chat.sources}</h3>
                        {m.citations.map((c) => (
                          <div key={c.index} className="flex items-start gap-3 rounded-[14px] bg-surface p-3 shadow-card ring-1 ring-separator/70 dark:ring-0">
                            <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[11px] font-semibold text-link">
                              {c.index}
                            </span>
                            <div className="min-w-0 text-[13px]">
                              <p className="truncate font-medium">
                                {c.documentTitle}
                                {c.page ? ` · ${f(t.chat.page, { page: c.page })}` : ""}
                              </p>
                              <p className="mt-0.5 line-clamp-2 text-muted">{c.snippet}</p>
                            </div>
                          </div>
                        ))}
                      </section>
                    )}
                  </div>
                )}
              </motion.article>
            ))}
          </AnimatePresence>

          {streaming && (
            <div className="flex justify-start">
              <p className="max-w-[92%] rounded-[20px] rounded-bl-[6px] bg-bubble px-4 py-2.5 text-[15px] leading-[1.5] whitespace-pre-wrap [overflow-wrap:anywhere]">
                {streamingText ? (
                  <CitationText text={streamingText} label={t.chat.citation} className="caret-blink" />
                ) : (
                  <span className="text-muted">{t.chat.thinking}</span>
                )}
              </p>
            </div>
          )}

          {messages.length === 0 && !streaming && chatProvider && hasReadyDocuments && (
            <div className="flex flex-col items-center gap-3 py-20 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-link">
                <Quote className="h-6 w-6" strokeWidth={1.6} />
              </span>
              <p className="max-w-xs text-[17px] text-muted">{t.chat.emptyThread}</p>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Always mounted, so screen readers hear "searching…" and then the finished answer. */}
      <p role="status" aria-live="polite" className="sr-only">
        {announcement?.kind === "thinking" ? t.chat.thinking : announcement?.kind === "answer" ? announcement.text : ""}
      </p>

      <div className="frosted shrink-0 border-t border-separator px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 sm:px-6">
        <form
          onSubmit={handleSend}
          className={cn(
            "mx-auto flex max-w-[720px] items-center gap-2 rounded-full border border-border bg-surface py-1 pl-4 pr-1 transition-[border-color,box-shadow] focus-within:border-primary focus-within:ring-4 focus-within:ring-ring",
            disabled && !streaming && "opacity-60"
          )}
        >
          <label htmlFor={inputId} className="sr-only">
            {t.chat.inputLabel}
          </label>
          <input
            id={inputId}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={disabled}
            placeholder={placeholder}
            autoComplete="off"
            className="h-9 min-w-0 flex-1 bg-transparent text-[17px] text-ellipsis outline-none placeholder:text-muted disabled:cursor-not-allowed sm:text-[15px]"
          />
          <button
            type="submit"
            disabled={disabled || !input.trim()}
            aria-label={t.chat.send}
            title={t.chat.send}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring disabled:bg-fill disabled:text-muted"
          >
            <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </form>
      </div>
    </div>
  );
}

function Banner({ icon: Icon, text, action }: { icon: React.ElementType; text: string; action?: React.ReactNode }) {
  return (
    <Card className="flex items-start gap-3 p-4 text-[13px] ring-1 ring-separator/70 dark:ring-0">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-warning-soft text-warning">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="flex flex-col gap-1 pt-1">
        <p className="text-foreground/85">{text}</p>
        {action}
      </div>
    </Card>
  );
}
