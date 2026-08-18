import { PDFParse } from "pdf-parse";

export async function extractPdfPages(buffer: Buffer): Promise<{ num: number; text: string }[]> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.pages
      .map((p) => ({ num: p.num, text: p.text.trim() }))
      .filter((p) => p.text.length > 0);
  } finally {
    await parser.destroy();
  }
}
