"use client";

import * as React from "react";
import Link from "next/link";
import useSWR from "swr";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { FileText, KeyRound, Loader2, MessagesSquare, RefreshCw, Trash2 } from "lucide-react";
import { fetcher } from "@/lib/fetcher";
import { deleteDocument, retryEmbedding } from "@/app/actions";
import type { DocumentDTO } from "@/lib/data";
import type { ChatProvider } from "@/lib/llm";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UploadDialog } from "./upload-dialog";

const STATUS_META = {
  PROCESSING: { variant: "warning" as const, label: "Processing" },
  READY: { variant: "success" as const, label: "Ready" },
  FAILED: { variant: "danger" as const, label: "Failed" },
};

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
  const hasProcessing = initialDocuments.some((d) => d.status === "PROCESSING");
  const { data: documents = initialDocuments, mutate } = useSWR<DocumentDTO[]>("/api/documents", fetcher, {
    fallbackData: initialDocuments,
    refreshInterval: hasProcessing ? 3000 : 15000,
  });

  const readyCount = documents.filter((d) => d.status === "READY").length;
  const totalChunks = documents.reduce((acc, d) => acc + d.chunkCount, 0);

  async function handleDelete(doc: DocumentDTO) {
    mutate(
      documents.filter((d) => d.id !== doc.id),
      false
    );
    await deleteDocument(doc.id);
    toast.success(`Deleted ${doc.title}`);
    mutate();
  }

  async function handleRetry(doc: DocumentDTO) {
    await retryEmbedding(doc.id);
    toast.success("Retrying…");
    mutate();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6 flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <p className="text-sm text-muted">Welcome back,</p>
          <h1 className="text-2xl font-semibold tracking-tight">{userName}</h1>
        </div>
        <div className="flex items-center gap-2">
          {readyCount > 0 && (
            <Button variant="secondary" asChild>
              <Link href="/chat">
                <MessagesSquare className="h-4 w-4" /> Open chat
              </Link>
            </Button>
          )}
          <UploadDialog />
        </div>
      </motion.div>

      {!chatProvider && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <Card className="flex items-start gap-2.5 border-warning/30 bg-warning-soft p-3 text-xs text-warning">
            <KeyRound className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              No LLM API key configured yet. Uploads still parse and chunk fine, but embedding (needed for search)
              requires <code className="rounded bg-surface px-1 py-0.5 whitespace-nowrap">OPENAI_API_KEY</code>{" "}
              specifically. Chat additionally accepts{" "}
              <code className="rounded bg-surface px-1 py-0.5 whitespace-nowrap">ANTHROPIC_API_KEY</code> or{" "}
              <code className="rounded bg-surface px-1 py-0.5 whitespace-nowrap">MOONSHOT_API_KEY</code>.
            </span>
          </Card>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3"
      >
        <StatCard icon={FileText} label="Documents" value={String(documents.length)} />
        <StatCard icon={FileText} label="Ready" value={String(readyCount)} />
        <StatCard icon={FileText} label="Chunks indexed" value={totalChunks.toLocaleString()} />
      </motion.div>

      <div className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {documents.map((doc, i) => {
            const meta = STATUS_META[doc.status as keyof typeof STATUS_META] ?? STATUS_META.PROCESSING;
            return (
              <motion.div
                key={doc.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.3, delay: Math.min(i, 6) * 0.03 }}
              >
                <Card>
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary",
                          doc.status === "PROCESSING" && "animate-pulse-ring"
                        )}
                      >
                        {doc.status === "PROCESSING" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-medium">{doc.title}</p>
                          <Badge variant={meta.variant}>{meta.label}</Badge>
                        </div>
                        <p className="text-xs text-muted">
                          {doc.pageCount} pages · {doc.chunkCount} chunks · uploaded{" "}
                          {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                        </p>
                        {doc.status === "FAILED" && doc.error && (
                          <p className="mt-1 text-xs text-danger">{doc.error}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {doc.status === "FAILED" && hasEmbeddings && (
                        <Button variant="ghost" size="sm" onClick={() => handleRetry(doc)}>
                          <RefreshCw className="h-3.5 w-3.5" /> Retry
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(doc)} aria-label="Delete document">
                        <Trash2 className="h-3.5 w-3.5 text-danger" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {documents.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-16 text-center">
            <FileText className="h-8 w-8 text-muted" />
            <p className="text-sm text-muted">No documents yet — upload a PDF to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-lg font-semibold leading-tight">{value}</p>
          <p className="text-xs text-muted">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
