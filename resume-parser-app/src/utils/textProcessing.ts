import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

/**
 * Minimal shapes we actually use from PDF.js
 * (we do NOT model the full library)
 */
type PdfTextItem = {
  str?: string;
  transform: number[];
  width: number;
  height: number;
};

type PositionedTextItem = {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * ✅ CRITICAL FIX
 * Use the legacy worker from the SAME build
 * and let Next.js bundle it correctly.
 */
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/legacy/build/pdf.worker.mjs",
  import.meta.url,
).toString();

export const extractTextItems = async (
  file: File,
): Promise<PositionedTextItem[]> => {
  const arrayBuffer = await file.arrayBuffer();

  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

  const textItems: PositionedTextItem[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1 });
    const textContent = await page.getTextContent();

    const items = (textContent.items as PdfTextItem[]).map((item) => {
      const transform = pdfjs.Util.transform(
        viewport.transform,
        item.transform,
      );

      return {
        str: item.str ?? "",
        x: transform[4],
        y: transform[5],
        width: item.width,
        height: item.height,
      };
    });

    textItems.push(...items);
  }

  return textItems;
};

export const groupTextItemsIntoLines = (
  textItems: PositionedTextItem[],
): string[] => {
  textItems.sort((a, b) => {
    if (Math.abs(a.y - b.y) < 5) return a.x - b.x;
    return b.y - a.y;
  });

  const lines: string[] = [];
  let currentLine = "";
  let currentY: number | null = null;

  for (const item of textItems) {
    if (!item.str.trim()) continue;

    if (currentY === null || Math.abs(item.y - currentY) > 5) {
      if (currentLine) lines.push(currentLine.trim());
      currentLine = item.str;
      currentY = item.y;
    } else {
      currentLine += " " + item.str;
    }
  }

  if (currentLine) lines.push(currentLine.trim());

  return lines;
};
