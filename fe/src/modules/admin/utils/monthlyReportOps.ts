/** Ops lokal: cocokkan Database Guru (.xlsx) + laporan Typeform (.csv). */

export type GuruDbRow = Record<string, string | number | boolean | null | undefined> & {
  ID_Guru?: string;
  Nama_Guru?: string;
  Status?: string;
  Agent?: string;
  Bank?: string;
  No_Rekening?: string;
  Bulan_Lapor_Terakhir?: string;
  Catatan?: string;
};

export type ProcessedGuru = GuruDbRow & {
  kategori: 'Sudah Lapor' | 'Belum Lapor' | 'Hentikan Transfer';
  tagClass: 'ok' | 'warn' | 'danger';
  gap: number | null;
  justReported: boolean;
  aksi: 'suspend' | 'reaktivasi' | null;
  apply: boolean;
};

export const NAMA_COL_DEFAULT = 'Nama Guru';
export const TGL_COL_DEFAULT = 'Submit Date (UTC)';

export function monthDiff(fromYm: string, toYm: string): number {
  const [ay, am] = fromYm.split('-').map(Number);
  const [by, bm] = toYm.split('-').map(Number);
  return (by - ay) * 12 + (bm - am);
}

export function normName(s: unknown): string {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function parseSubmitDate(str: unknown): Date | null {
  if (str == null || str === '') return null;
  if (str instanceof Date) return Number.isNaN(str.getTime()) ? null : str;
  if (typeof str === 'number' && Number.isFinite(str)) {
    // Excel serial date (hari sejak 1899-12-30)
    const utcDays = Math.floor(str - 25569);
    const frac = str - Math.floor(str);
    const ms = utcDays * 86400_000 + Math.round(frac * 86400_000);
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const raw = String(str).trim();
  if (/^\d+(\.\d+)?$/.test(raw)) {
    return parseSubmitDate(Number(raw));
  }
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function ymFromDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function categorizeGap(gap: number | null): {
  kategori: ProcessedGuru['kategori'];
  tagClass: ProcessedGuru['tagClass'];
} {
  if (gap === null) return { kategori: 'Belum Lapor', tagClass: 'warn' };
  if (gap <= 0) return { kategori: 'Sudah Lapor', tagClass: 'ok' };
  if (gap === 1) return { kategori: 'Belum Lapor', tagClass: 'warn' };
  return { kategori: 'Hentikan Transfer', tagClass: 'danger' };
}

export function ensureLastReportCol(rows: GuruDbRow[], headers: string[]): string[] {
  if (!headers.includes('Bulan_Lapor_Terakhir')) {
    headers = [...headers, 'Bulan_Lapor_Terakhir'];
    for (const r of rows) r.Bulan_Lapor_Terakhir = '';
  }
  return headers;
}

export function processMonthlyReports(input: {
  db: GuruDbRow[];
  csvRows: Record<string, string>[];
  processingMonth: string;
  namaCol?: string;
  tglCol?: string;
}): { processed: ProcessedGuru[]; matchedCount: number; unmatchedNames: string[] } {
  const namaCol = input.namaCol ?? NAMA_COL_DEFAULT;
  const tglCol = input.tglCol ?? TGL_COL_DEFAULT;
  const db = input.db.map((r) => ({ ...r }));

  const latestByName: Record<string, { date: Date; raw: Record<string, string> }> = {};
  for (const row of input.csvRows) {
    const nm = normName(row[namaCol]);
    if (!nm) continue;
    const d = parseSubmitDate(row[tglCol]);
    if (!d) continue;
    const existing = latestByName[nm];
    if (!existing || d > existing.date) latestByName[nm] = { date: d, raw: row };
  }

  const dbNameIndex: Record<string, number> = {};
  db.forEach((r, i) => {
    dbNameIndex[normName(r.Nama_Guru)] = i;
  });

  let matchedCount = 0;
  const unmatchedNames: string[] = [];
  for (const [nm, entry] of Object.entries(latestByName)) {
    const rowMonth = ymFromDate(entry.date);
    if (nm in dbNameIndex) {
      const i = dbNameIndex[nm]!;
      db[i]!.Bulan_Lapor_Terakhir = rowMonth;
      (db[i] as GuruDbRow & { _laporBulanIni?: boolean })._laporBulanIni = true;
      matchedCount += 1;
    } else {
      unmatchedNames.push(String(entry.raw[namaCol] ?? nm));
    }
  }

  const processed: ProcessedGuru[] = db.map((r) => {
    const status = String(r.Status ?? '');
    const isAktif = /aktif/i.test(status);
    const isSuspend = /suspend/i.test(status);
    const lastMonth = String(r.Bulan_Lapor_Terakhir ?? '');
    const gap = lastMonth ? monthDiff(lastMonth, input.processingMonth) : null;
    const justReported = !!(r as { _laporBulanIni?: boolean })._laporBulanIni;
    const { kategori, tagClass } = categorizeGap(gap);

    let aksi: ProcessedGuru['aksi'] = null;
    if (kategori === 'Hentikan Transfer' && isAktif) aksi = 'suspend';
    else if (kategori === 'Sudah Lapor' && isSuspend) aksi = 'reaktivasi';

    const { _laporBulanIni: _, ...rest } = r as GuruDbRow & { _laporBulanIni?: boolean };
    return {
      ...rest,
      kategori,
      tagClass,
      gap,
      justReported,
      aksi,
      apply: !!aksi && (isAktif || isSuspend),
    };
  });

  return { processed, matchedCount, unmatchedNames };
}

export function rowsForExport(
  processed: ProcessedGuru[],
  headers: string[],
  processingMonth: string,
): { rows: Record<string, string>[]; headers: string[] } {
  const finalHeaders = headers.includes('Catatan') ? headers : [...headers, 'Catatan'];
  const rows = processed.map((r) => {
    const out: Record<string, string> = {};
    for (const h of finalHeaders) {
      let val = r[h];
      if (r.apply) {
        if (h === 'Status') {
          if (r.aksi === 'suspend') val = 'Suspend';
          else if (r.aksi === 'reaktivasi') val = 'Aktif (Sudah Daftar Ulang)';
        }
        if (h === 'Catatan' && r.aksi === 'suspend') {
          const base = String(r.Catatan ?? '');
          val = `${base}; Auto-suspend ${processingMonth}: tidak lapor 2 bulan berturut`.replace(/^; /, '');
        }
        if (h === 'Catatan' && r.aksi === 'reaktivasi') {
          const base = String(r.Catatan ?? '');
          val = `${base}; Reaktivasi ${processingMonth}: guru lapor kembali`.replace(/^; /, '');
        }
      }
      out[h] = val == null ? '' : String(val);
    }
    return out;
  });
  return { rows, headers: finalHeaders };
}

/** ponytail: self-check kategori — gagal kalau gap logic berubah diam-diam */
export function assertMonthlyReportOpsSelfCheck(): void {
  const cases: Array<[number | null, ProcessedGuru['kategori']]> = [
    [null, 'Belum Lapor'],
    [0, 'Sudah Lapor'],
    [-1, 'Sudah Lapor'],
    [1, 'Belum Lapor'],
    [2, 'Hentikan Transfer'],
    [5, 'Hentikan Transfer'],
  ];
  for (const [gap, want] of cases) {
    const got = categorizeGap(gap).kategori;
    if (got !== want) throw new Error(`categorizeGap(${gap})=${got}, want ${want}`);
  }
  if (monthDiff('2026-05', '2026-07') !== 2) throw new Error('monthDiff broken');
  if (normName('  BuDi  Santoso ') !== 'budi santoso') throw new Error('normName broken');
}
