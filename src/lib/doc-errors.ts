import type { Dictionary } from "@/i18n/dictionaries/en";

/**
 * Failure reasons stored on Document.error by the ingest pipeline. The stored text stays in
 * English (existing rows keep working); the UI maps these known values to the active language.
 * Rows written before these reasons existed may hold some other text, which is shown as is.
 */
export const DOC_ERRORS = {
  noEmbeddingsKey: "No OPENAI_API_KEY configured — set one and retry.",
  noTextScanned: "No extractable text found — this PDF may be scanned images without OCR text.",
  noText: "No extractable text found in this PDF.",
  processFailed: "Failed to process PDF",
  embedFailed: "Embedding failed",
} as const;

/**
 * An embedding failure is stored as `${DOC_ERRORS.embedFailed}: ${provider message}`, so the
 * provider's own (untranslatable) detail can follow a translated lead-in.
 */
export const EMBED_DETAIL_SEPARATOR = ": ";

export function localizeDocumentError(
  error: string,
  { t, f }: { t: Dictionary; f: (template: string, vars?: Record<string, string | number>) => string }
): string {
  switch (error) {
    case DOC_ERRORS.noEmbeddingsKey:
      return t.library.errors.noEmbeddingsKey;
    case DOC_ERRORS.noTextScanned:
    case DOC_ERRORS.noText:
      return t.library.errors.noText;
    case DOC_ERRORS.processFailed:
      return t.library.errors.processFailed;
    case DOC_ERRORS.embedFailed:
      return t.library.errors.embedFailed;
  }
  const detailPrefix = DOC_ERRORS.embedFailed + EMBED_DETAIL_SEPARATOR;
  if (error.startsWith(detailPrefix)) {
    return f(t.library.errors.embedFailedDetail, { message: error.slice(detailPrefix.length) });
  }
  return error;
}
