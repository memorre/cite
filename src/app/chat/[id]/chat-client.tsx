"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { ArrowUp, FileText, KeyRound, Quote } from "lucide-react";
import type { ChatProvider } from "@/lib/llm";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

type Citation = { index: number; documentId: string; documentTitle: string; page: number | null; snippet: string };
type ChatMessage = { id: string; role: "USER" | "ASSISTANT"; content: string; citations: Citation[] | null };

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
  const [messages, setMessages] = React.useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = React.useState("");
  const [streaming, setStreaming] = React.useState(false);
  const [streamingText, setStreamingText] = React.useState("");
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
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

    try {
      const res = await fetch(`/api/chat/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question }),
      });

      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        const marker = full.indexOf("\n\n<<CITATIONS>>");
        setStreamingText(marker === -1 ? full : full.slice(0, marker));
      }

      const marker = full.indexOf("\n\n<<CITATIONS>>");
      const text = marker === -1 ? full : full.slice(0, marker);
      let citations: Citation[] = [];
      if (marker !== -1) {
        try {
          citations = JSON.parse(full.slice(marker + "\n\n<<CITATIONS>>".length));
        } catch {
          citations = [];
        }
      }

      setMessages((prev) => [...prev, { id: `tmp-assistant-${Date.now()}`, role: "ASSISTANT", content: text, citations }]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to get a response");
    } finally {
      setStreaming(false);
      setStreamingText("");
    }
  }

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1">
        <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6">
          {!chatProvider && (
            <Banner icon={KeyRound} text="No LLM API key configured yet — chat is disabled until one is set." />
          )}
          {chatProvider && !hasReadyDocuments && (
            <Banner icon={FileText} text="Upload and process at least one document before chatting." />
          )}

          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex", m.role === "USER" ? "justify-end" : "justify-start")}
              >
                <div className={cn("max-w-[85%]", m.role === "USER" ? "" : "w-full")}>
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                      m.role === "USER" ? "bg-primary text-primary-foreground" : "bg-surface-2 text-foreground"
                    )}
                  >
                    {m.content}
                  </div>
                  {m.role === "ASSISTANT" && m.citations && m.citations.length > 0 && (
                    <div className="mt-2 flex flex-col gap-1.5">
                      {m.citations.map((c) => (
                        <div key={c.index} className="flex items-start gap-2 rounded-xl border border-border bg-surface p-2.5 text-xs">
                          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[10px] font-semibold text-primary">
                            {c.index}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {c.documentTitle}
                              {c.page ? ` · p.${c.page}` : ""}
                            </p>
                            <p className="mt-0.5 line-clamp-2 text-muted">{c.snippet}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {streaming && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl bg-surface-2 px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
                {streamingText}
                <span className="caret-blink" />
              </div>
            </div>
          )}

          {messages.length === 0 && !streaming && chatProvider && hasReadyDocuments && (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <Quote className="h-6 w-6 text-muted" />
              <p className="text-sm text-muted">Ask anything about the documents in your library.</p>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <div className="border-t border-border p-4">
        <form onSubmit={handleSend} className="mx-auto flex max-w-2xl items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={disabled}
            placeholder={
              !chatProvider
                ? "Chat is disabled — no API key configured"
                : !hasReadyDocuments
                  ? "Upload a document first…"
                  : "Ask a question about your documents…"
            }
            className="flex h-11 w-full rounded-full border border-border bg-surface px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          />
          <Button type="submit" size="icon" disabled={disabled || !input.trim()} aria-label="Send">
            <ArrowUp className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

function Banner({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <Card className="flex items-center gap-2.5 border-warning/30 bg-warning-soft p-3 text-xs text-warning">
      <Icon className="h-4 w-4 shrink-0" />
      {text}
    </Card>
  );
}
