import { requireUser } from "@/lib/session";
import { listDocumentsForUser } from "@/lib/data";
import { hasEmbeddingsProvider, getChatProvider } from "@/lib/llm";
import { LibraryClient } from "./library-client";

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
