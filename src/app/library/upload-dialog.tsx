"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText, FileUp, Upload } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const MAX_FILE_BYTES = 4 * 1024 * 1024;

export function UploadDialog() {
  const router = useRouter();
  const { t } = useI18n();
  const inputId = React.useId();
  const [open, setOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [pending, setPending] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function pick(selected: File | undefined) {
    setError(null);
    if (!selected) {
      setFile(null);
      return;
    }
    if (selected.type !== "application/pdf") {
      setError(t.upload.errors.onlyPdf);
      setFile(null);
      return;
    }
    if (selected.size > MAX_FILE_BYTES) {
      setError(t.upload.errors.tooLarge);
      setFile(null);
      return;
    }
    setFile(selected);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    pick(e.target.files?.[0]);
    // Allow choosing the same file again after an error.
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragging(false);
    pick(e.dataTransfer.files?.[0]);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setFile(null);
      setError(null);
      setDragging(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError(t.upload.errors.chooseFile);
      return;
    }
    setPending(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof body.error === "string" ? body.error : t.upload.errors.failed);
        return;
      }
      toast.success(t.upload.success);
      handleOpenChange(false);
      router.refresh();
    } catch {
      setError(t.upload.errors.network);
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button onClick={() => setOpen(true)}>
        <Upload /> {t.upload.trigger}
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.upload.title}</DialogTitle>
          <DialogDescription>{t.upload.description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label
            htmlFor={inputId}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-2 rounded-[16px] border-[1.5px] border-dashed px-4 py-9 text-center transition-colors has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-ring",
              dragging ? "border-primary bg-primary-soft" : "border-border bg-surface-2 hover:border-primary/50"
            )}
          >
            {file ? (
              <FileText className="h-8 w-8 text-link" strokeWidth={1.6} />
            ) : (
              <FileUp className="h-8 w-8 text-muted" strokeWidth={1.6} />
            )}
            <span className="max-w-full truncate text-[15px] font-medium">
              {dragging ? t.upload.dropActive : (file?.name ?? t.upload.choose)}
            </span>
            {!file && !dragging && <span className="text-[13px] text-muted">{t.upload.drop}</span>}
            <input
              id={inputId}
              name="file"
              type="file"
              accept="application/pdf"
              className="sr-only"
              onChange={handleFileChange}
            />
          </label>

          {error && (
            <p role="alert" className="rounded-[12px] bg-danger-soft px-3.5 py-2.5 text-[13px] text-danger">
              {error}
            </p>
          )}

          <DialogFooter className="mt-2">
            <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={pending || !file}>
              {pending ? t.upload.submitting : t.upload.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
