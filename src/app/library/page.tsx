import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { listDocumentsForUser } from "@/lib/data";
import { hasEmbeddingsProvider, getChatProvider } from "@/lib/llm";
import { getI18n } from "@/i18n/server";
import { LibraryClient } from "./library-client";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.meta.library };
}

export default async function LibraryPage() {
  const user = await requireUser();
  const documents = await listDocumentsForUser(user.id);

  return (
    <LibraryClient
      userName={user.name}
      initialDocuments={documents}
      hasEmbeddings={hasEmbeddingsProvider()}
      chatProvider={getChatProvider()}
    />
  );
}
