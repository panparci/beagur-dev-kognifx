import type { AnalyticsSnapshotInput } from '@core/types';

const MONTH_ID: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  mei: 5,
  jun: 6,
  jul: 7,
  agt: 8,
  aug: 8,
  sep: 9,
  okt: 10,
  nov: 11,
  des: 12,
};

const HEADER_KEYS = [
  'month',
  'donationAmount',
  'donationCount',
  'donorCount',
  'transferAmount',
  'teachersCumulative',
] as const;

type HeaderKey = (typeof HEADER_KEYS)[number];

const HEADER_ALIASES: Record<HeaderKey, string[]> = {
  month: ['month', 'bulan', 'periode', 'period', 'label', 'bln'],
  donationAmount: ['donationamount', 'donasi', 'jumlahdonasi', 'nominaldonasi', 'donasimasuk'],
  donationCount: ['donationcount', 'transaksi', 'jumlahtransaksi', 'tx'],
  donorCount: ['donorcount', 'donor', 'donatur', 'jumlahdonatur', 'org'],
  transferAmount: ['transferamount', 'transfer', 'penyaluran', 'salur', 'tersalurkan', 'keluar'],
  teachersCumulative: ['teacherscumulative', 'guru', 'jumlahguru', 'teachers', 'gurubinaan'],
};

export const ANALYTICS_IMPORT_TEMPLATE = `bulan,donatur,donasi,transfer,guru
2025-07-01,83,72439799,4000000,
2025-08-01,45,31659275,4400000,
2025-09-01,32,39892597,4400000,
`;

function normHeader(cell: string): string {
  return cell
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]/g, '');
}

/** Parses Indonesian / US number formats (72.439.799, 72,439,799, Rp …). */
export function parseIdNumber(raw: string | number | null | undefined): number | undefined {
  if (raw == null) return undefined;
  if (typeof raw === 'number') return Number.isFinite(raw) ? Math.round(raw) : undefined;
  const s = String(raw).trim();
  if (!s) return undefined;
  let cleaned = s.replace(/[^\d.,-]/g, '');
  if (!cleaned) return undefined;

  const dots = (cleaned.match(/\./g) || []).length;
  const commas = (cleaned.match(/,/g) || []).length;
  if (dots > 1 || (dots === 1 && commas === 0 && cleaned.split('.').pop()!.length === 3)) {
    cleaned = cleaned.replace(/\./g, '');
  } else if (commas > 1) {
    cleaned = cleaned.replace(/,/g, '');
  } else if (commas === 1 && dots === 0) {
    const [, dec] = cleaned.split(',');
    cleaned = dec?.length === 3 ? cleaned.replace(/,/g, '') : cleaned.replace(',', '.');
  }
  const n = Number(cleaned);
  return Number.isFinite(n) ? Math.round(n) : undefined;
}

export function parseMonthLabel(raw: string): string | null {
  const s = raw.trim();
  if (!s || /^total/i.test(s)) return null;

  const iso = s.match(/^(\d{4})-(\d{2})(?:-\d{2})?$/);
  if (iso) return `${iso[1]}-${iso[2]}-01`;

  const m = s.match(/^([A-Za-z]{3,4})\s*(\d{2,4})?$/);
  if (m) {
    const monthNum = MONTH_ID[m[1].slice(0, 3).toLowerCase()];
    if (!monthNum) return null;
    let year = new Date().getFullYear();
    if (m[2]) {
      const y = Number(m[2]);
      year = m[2].length === 2 ? 2000 + y : y;
    }
    return `${year}-${String(monthNum).padStart(2, '0')}-01`;
  }
  return null;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if ((ch === ',' || ch === ';') && !inQuotes) {
      out.push(cur.trim());
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

function detectHeaderMap(cells: string[]): Partial<Record<HeaderKey, number>> | null {
  const normed = cells.map(normHeader);
  const hasKnown = normed.some((c) =>
    HEADER_KEYS.some((k) => HEADER_ALIASES[k].some((a) => c === a || c.includes(a))),
  );
  if (!hasKnown) return null;

  const map: Partial<Record<HeaderKey, number>> = {};
  normed.forEach((cell, idx) => {
    for (const key of HEADER_KEYS) {
      if (HEADER_ALIASES[key].some((a) => cell === a || cell.includes(a))) {
        if (map[key] == null) map[key] = idx;
      }
    }
  });
  return Object.keys(map).length > 0 ? map : null;
}

function positionalMap(width: number): Partial<Record<HeaderKey, number>> {
  if (width >= 6) {
    return {
      month: 0,
      donationAmount: 1,
      donationCount: 2,
      donorCount: 3,
      transferAmount: 4,
      teachersCumulative: 5,
    };
  }
  if (width === 4) {
    return { month: 0, donorCount: 1, donationAmount: 2, transferAmount: 3 };
  }
  if (width === 3) {
    return { month: 0, donorCount: 1, donationAmount: 2 };
  }
  return { month: 0, donationAmount: 1, transferAmount: 2 };
}

function rowToSnapshot(cells: string[], map: Partial<Record<HeaderKey, number>>): AnalyticsSnapshotInput | null {
  const pick = (key: HeaderKey) => {
    const idx = map[key];
    return idx == null ? undefined : cells[idx];
  };
  const monthRaw = pick('month') ?? cells[0];
  const month = parseMonthLabel(monthRaw ?? '');
  if (!month) return null;

  return {
    month,
    donationAmount: parseIdNumber(pick('donationAmount')),
    donationCount: parseIdNumber(pick('donationCount')),
    donorCount: parseIdNumber(pick('donorCount')),
    transferAmount: parseIdNumber(pick('transferAmount')),
    teachersCumulative: parseIdNumber(pick('teachersCumulative')),
    source: 'import',
  };
}

/** Tabular rows (CSV, Excel sheet, parsed PDF lines). */
export function parseAnalyticsTable(rows: string[][]): AnalyticsSnapshotInput[] {
  const nonEmpty = rows.filter((r) => r.some((c) => String(c ?? '').trim()));
  if (nonEmpty.length === 0) return [];

  let dataRows = nonEmpty;
  let map = detectHeaderMap(nonEmpty[0].map(String));
  if (map) dataRows = nonEmpty.slice(1);

  const out: AnalyticsSnapshotInput[] = [];
  for (const row of dataRows) {
    const cells = row.map((c) => String(c ?? '').trim());
    if (cells.every((c) => !c) || /^total/i.test(cells[0])) continue;
    const rowMap = map ?? positionalMap(cells.length);
    const snap = rowToSnapshot(cells, rowMap);
    if (snap) out.push(snap);
  }
  return out;
}

export function parseAnalyticsCsv(text: string): AnalyticsSnapshotInput[] {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim());
  const rows = lines.map(splitCsvLine);
  return parseAnalyticsTable(rows);
}

export async function parseAnalyticsExcel(buffer: ArrayBuffer): Promise<AnalyticsSnapshotInput[]> {
  const XLSX = await import('xlsx');
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return [];
  const rows = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
  });
  return parseAnalyticsTable(rows.map((r) => r.map(String)));
}

export async function parseAnalyticsPdf(buffer: ArrayBuffer): Promise<AnalyticsSnapshotInput[]> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();

  const doc = await pdfjs.getDocument({ data: buffer }).promise;
  let text = '';
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    text +=
      content.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim() + '\n';
  }

  const tableLines = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter(
      (l) =>
        l &&
        !/^total/i.test(l) &&
        (/^(jan|feb|mar|apr|mei|jun|jul|agt|aug|sep|okt|nov|des)/i.test(l) || /^\d{4}-\d{2}/.test(l)),
    );

  if (tableLines.length >= 1) {
    const rows = tableLines.map((line) => line.split(/\t|\s{2,}|(?<=\d)\s+(?=[A-Za-z])|\s+(?=\d)/));
    const parsed = parseAnalyticsTable(rows);
    if (parsed.length > 0) return parsed;
  }
  return parseAnalyticsCsv(text);
}

export async function parseAnalyticsImportFile(file: File): Promise<AnalyticsSnapshotInput[]> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const buf = await file.arrayBuffer();

  if (ext === 'xlsx' || ext === 'xls') return parseAnalyticsExcel(buf);
  if (ext === 'pdf') return parseAnalyticsPdf(buf);
  return parseAnalyticsCsv(new TextDecoder().decode(buf));
}

/** ponytail: runnable self-check — `npx tsx fe/src/core/domain/analyticsImport.ts` */
export function runAnalyticsImportSelfCheck(): void {
  const csv = parseAnalyticsCsv(ANALYTICS_IMPORT_TEMPLATE);
  if (csv.length < 2) throw new Error('CSV template should yield >= 2 rows');

  const idRows = parseAnalyticsTable([
    ['label', 'donatur', 'donasi', 'transfer'],
    ['Jul 25', '83', '72.439.799', '4.000.000'],
    ['Jan 26', '35', '19.687.668', '8.000.000'],
  ]);
  if (idRows.length !== 2 || idRows[0].month !== '2025-07-01') {
    throw new Error('Indonesian table parse failed');
  }
  if (idRows[0].donationAmount !== 72439799) throw new Error('parseIdNumber dots failed');
}

if (import.meta.url.endsWith('analyticsImport.ts')) {
  runAnalyticsImportSelfCheck();
  console.log('analyticsImport self-check OK');
}
