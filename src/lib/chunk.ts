import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export type PendingChunk = { content: string; page: number | null; chunkIndex: number };

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 150,
});

/** Chunks page-by-page so every chunk keeps an exact source page for citations. */
export async function chunkPages(pages: { num: number; text: string }[]): Promise<PendingChunk[]> {
  const chunks: PendingChunk[] = [];
  let chunkIndex = 0;
  for (const page of pages) {
    const pieces = await splitter.splitText(page.text);
    for (const content of pieces) {
      chunks.push({ content, page: page.num, chunkIndex: chunkIndex++ });
    }
  }
  return chunks;
}
