import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";

// ✅ Use fake worker if no worker file exists
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.mjs?worker";

pdfjsLib.GlobalWorkerOptions.workerPort = new Worker(
  new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url),
  { type: "module" }
);

export const extractTextItems = async (file: File): Promise<any[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const textItems: any[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1 });
    const textContent = await page.getTextContent();

    const items = textContent.items.map((item: any) => {
      const transform = pdfjsLib.Util.transform(
        viewport.transform,
        item.transform
      );
      return {
        str: item.str,
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

export const groupTextItemsIntoLines = (textItems: any[]): string[] => {
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
