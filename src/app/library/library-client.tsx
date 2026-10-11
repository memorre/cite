"use client";

import * as React from "react";
import Link from "next/link";
import useSWR from "swr";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { FileText, KeyRound, Loader2, MessagesSquare, RefreshCw, Trash2, TriangleAlert } from "lucide-react";
import { fetcher } from "@/lib/fetcher";
import { deleteDocument, retryEmbedding } from "@/app/actions";
import type { DocumentDTO } from "@/lib/data";
import type { ChatProvider } from "@/lib/llm";
import { localizeDocumentError } from "@/lib/doc-errors";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/client";
import { rich } from "@/i18n/rich";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { UploadDialog } from "./upload-dialog";

const STATUS_VARIANT = {
  PROCESSING: "warning",
  READY: "success",
  FAILED: "danger",
} as const;

type Status = keyof typeof STATUS_VARIANT;

export function LibraryClient({
  userName,
  initialDocuments,
  hasEmbeddings,
  chatProvider,
}: {
  userName: string;
  initialDocuments: DocumentDTO[];
  hasEmbeddings: boolean;
  chatProvider: ChatProvider;
}) {
  const i18n = useI18n();
  const { t, f, p } = i18n;
  const hasProcessing = initialDocuments.some((d) => d.status === "PROCESSING");
  const { data: documents = initialDocuments, mutate } = useSWR<DocumentDTO[]>("/api/documents", fetcher, {
    fallbackData: initialDocuments,
    refreshInterval: hasProcessing ? 3000 : 15000,
  });
  // The target outlives the dialog's open state so its text doesn't blank out while it animates closed.
  const [deleteTarget, setDeleteTarget] = React.useState<DocumentDTO | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  // Where keyboard focus goes when the confirmation closes: back to the row's delete button, or,
  // once that row has been deleted, to the list heading.
  const deleteOpenerRef = React.useRef<HTMLElement | null>(null);
  const listHeadingRef = React.useRef<HTMLHeadingElement>(null);

  const readyCount = documents.filter((d) => d.status === "READY").length;
  const totalChunks = documents.reduce((acc, d) => acc + d.chunkCount, 0);

  async function handleDelete(doc: DocumentDTO) {
    mutate(
      documents.filter((d) => d.id !== doc.id),
      false
    );
    try {
      await deleteDocument(doc.id);
      toast.success(f(t.library.deleted, { title: doc.title }));
    } catch {
      toast.error(t.library.deleteFailed);
    }
    mutate();
  }

  async function handleRetry(doc: DocumentDTO) {
    toast(t.library.retrying);
    try {
      await retryEmbedding(doc.id);
    } catch {
      toast.error(t.library.retryFailed);
    }
    mutate();
  }

  const code = (text: string) => (
    <code className="rounded-[6px] bg-fill px-1.5 py-0.5 text-[12px] whitespace-nowrap text-foreground">{text}</code>
  );

  return (
    <div className="min-h-[calc(100dvh-var(--nav-h))] bg-background-alt">
      <div className="mx-auto max-w-[980px] px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
        <div className="rise mb-8 flex flex-wrap items-end justify-between gap-x-4 gap-y-5">
          <div className="min-w-0">
            <p className="truncate text-[15px] text-muted">{f(t.library.greeting, { name: userName })}</p>
            <h1 className="text-[34px] font-bold leading-tight tracking-headline sm:text-[40px]">{t.library.title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {readyCount > 0 && (
              <Button variant="secondary" asChild>
                <Link href="/chat">
                  <MessagesSquare /> {t.library.openChat}
                </Link>
              </Button>
            )}
            <UploadDialog />
          </div>
        </div>

        {!chatProvider && (
          <Card className="mb-6 flex items-start gap-3 p-4 text-[13px] leading-relaxed">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-warning-soft text-warning">
              <KeyRound className="h-3.5 w-3.5" />
            </span>
            <p className="pt-0.5 text-foreground/85">
              {rich(t.library.noKey, {
                openai: code("OPENAI_API_KEY"),
                anthropic: code("ANTHROPIC_API_KEY"),
                moonshot: code("MOONSHOT_API_KEY"),
              })}
            </p>
          </Card>
        )}

        <Card aria-label={t.library.stats.label} role="group" className="mb-10 grid grid-cols-3 divide-x divide-separator py-5">
          <Stat label={t.library.stats.documents} value={i18n.number(documents.length)} />
          <Stat label={t.library.stats.ready} value={i18n.number(readyCount)} />
          <Stat label={t.library.stats.passages} value={i18n.number(totalChunks)} />
        </Card>

        <h2 ref={listHeadingRef} tabIndex={-1} className="mb-2 px-4 text-[13px] font-medium text-muted outline-none">
          {t.library.listTitle}
        </h2>

        {documents.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-link">
              <FileText className="h-6 w-6" strokeWidth={1.8} />
            </span>
            <div>
              <p className="text-[17px] font-semibold">{t.library.emptyTitle}</p>
              <p className="mt-1 text-[15px] text-muted">{t.library.emptyBody}</p>
            </div>
            <div className="mt-2">
              <UploadDialog />
            </div>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <ul>
              <AnimatePresence initial={false}>
                {documents.map((doc) => {
                  const status = (doc.status in STATUS_VARIANT ? doc.status : "PROCESSING") as Status;
                  const meta = [
                    p(t.library.pages, doc.pageCount),
                    p(t.library.passages, doc.chunkCount),
                    f(t.library.uploaded, { time: i18n.relative(doc.createdAt) }),
                  ].join(" · ");
                  return (
                    <motion.li
                      key={doc.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="group flex gap-3.5 pl-4"
                    >
                      <span
                        className={cn(
                          "mt-3.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]",
                          status === "FAILED" ? "bg-danger-soft text-danger" : "bg-primary-soft text-link"
                        )}
                        aria-hidden="true"
                      >
                        {status === "PROCESSING" ? (
                          <Loader2 className="h-[18px] w-[18px] animate-spin" />
                        ) : status === "FAILED" ? (
                          <TriangleAlert className="h-[18px] w-[18px]" strokeWidth={1.8} />
                        ) : (
                          <FileText className="h-[18px] w-[18px]" strokeWidth={1.8} />
                        )}
                      </span>
                      <div className="flex min-w-0 flex-1 items-center gap-2 border-b border-separator py-3.5 pr-2 group-last:border-b-0 sm:gap-4 sm:pr-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 items-center gap-2">
                            <p className="truncate text-[15px] font-medium">{doc.title}</p>
                            <Badge variant={STATUS_VARIANT[status]} className="shrink-0">
                              {t.library.status[status]}
                            </Badge>
                          </div>
                          <p className="mt-0.5 text-[13px] text-muted" suppressHydrationWarning>
                            {meta}
                          </p>
                          {status === "FAILED" && doc.error && (
                            <p className="mt-1 text-[13px] text-danger-text">{localizeDocumentError(doc.error, i18n)}</p>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-0.5">
                          {status === "FAILED" && hasEmbeddings && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRetry(doc)}
                              className="text-link max-sm:w-10 max-sm:px-0"
                            >
                              <RefreshCw /> <span className="max-sm:sr-only">{t.library.retry}</span>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              deleteOpenerRef.current = e.currentTarget;
                              setDeleteTarget(doc);
                              setConfirmOpen(true);
                            }}
                            aria-label={f(t.library.deleteLabel, { title: doc.title })}
                            title={t.common.delete}
                            className="text-muted hover:bg-danger-soft hover:text-danger"
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t.library.deleteTitle}
        description={f(t.library.deleteBody, { title: deleteTarget?.title ?? "" })}
        confirmLabel={t.common.delete}
        onConfirm={() => {
          // The row (and its button) is about to go away.
          deleteOpenerRef.current = null;
          if (deleteTarget) handleDelete(deleteTarget);
        }}
        returnFocusRef={deleteOpenerRef}
        fallbackFocusRef={listHeadingRef}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-0.5 px-2 text-center">
      <p className="text-[26px] font-semibold leading-tight tabular-nums tracking-headline sm:text-[28px]">{value}</p>
      <p className="text-[12px] leading-snug text-muted text-balance sm:text-[13px]">{label}</p>
    </div>
  );
}
