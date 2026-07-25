import * as pdfjsLib from 'pdfjs-dist';
import type { BankDirection, BankLineInput } from '../services/reconciliationService';
import { parseJagoStatementText } from './jagoStatementParse';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

function reconstructLines(items: Array<{ str?: string; transform?: number[] }>): string[] {
  const rows = new Map<number, { x: number; str: string }[]>();
  for (const item of items) {
    if (!item.str?.trim() || !item.transform) continue;
    const y = Math.round(item.transform[5] / 2) * 2;
    const x = item.transform[4];
    if (!rows.has(y)) rows.set(y, []);
    rows.get(y)!.push({ x, str: item.str });
  }
  return Array.from(rows.keys())
    .sort((a, b) => b - a)
    .map((y) =>
      rows
        .get(y)!
        .sort((a, b) => a.x - b.x)
        .map((i) => i.str)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter(Boolean);
}

export async function extractPdfText(file: File): Promise<string> {
  const data = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data }).promise;
  const lines: string[] = [];
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    lines.push(...reconstructLines(content.items as Array<{ str?: string; transform?: number[] }>));
  }
  return lines.join('\n');
}

export async function parseJagoPdfFile(file: File, direction: BankDirection): Promise<BankLineInput[]> {
  const text = await extractPdfText(file);
  return parseJagoStatementText(text, direction);
}

export { parseJagoStatementText };
