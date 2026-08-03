import { useMemo, useRef, useState, type DragEvent } from 'react';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, FileUp } from 'lucide-react';
import Card from '@core/ui/Card';
import Button from '@core/ui/Button';
import Badge from '@core/ui/Badge';
import StatCard from '@core/ui/StatCard';
import { PortalSectionHead } from '@core/ui/portal/PortalPrimitives';
import { showTab } from '@core/ui/tabPanel';
import { usePortalNav } from '@core/routing/usePortalNav';
import { useToast } from '@core/ui/toast/ToastProvider';
import { ADMIN_MONTHLY_REPORT_OPS_TAB } from '@core/constants/tabs';
import {
  GuruDbRow,
  NAMA_COL_DEFAULT,
  ProcessedGuru,
  TGL_COL_DEFAULT,
  assertMonthlyReportOpsSelfCheck,
  ensureLastReportCol,
  processMonthlyReports,
  rowsForExport,
} from '../../utils/monthlyReportOps';

type Step = 1 | 2 | 3;
type ResultTab = 'perlu' | 'sudah' | 'belum' | 'hentikan' | 'semua' | 'unmatch';

try {
  assertMonthlyReportOpsSelfCheck();
} catch (e) {
  console.error('[monthlyReportOps]', e);
}

function parseCsvText(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const wb = XLSX.read(text, { type: 'string', raw: false, FS: ',' });
  const sheet = wb.Sheets[wb.SheetNames[0]!];
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet!, { defval: '' });
  const headers = rows[0] ? Object.keys(rows[0]) : [];
  return { headers, rows };
}

export function AdminMonthlyReportOpsTab() {
  const { activeTab } = usePortalNav();
  const toast = useToast();
  const active = activeTab === ADMIN_MONTHLY_REPORT_OPS_TAB;

  const dbInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>(1);
  const [dbFileName, setDbFileName] = useState('');
  const [dbSheetName, setDbSheetName] = useState('');
  const [db, setDb] = useState<GuruDbRow[]>([]);
  const [dbHeaders, setDbHeaders] = useState<string[]>([]);
  const [csvFileName, setCsvFileName] = useState('');
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvWarn, setCsvWarn] = useState('');
  const [processingMonth, setProcessingMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [processed, setProcessed] = useState<ProcessedGuru[]>([]);
  const [matchedCount, setMatchedCount] = useState(0);
  const [unmatchedNames, setUnmatchedNames] = useState<string[]>([]);
  const [resultTab, setResultTab] = useState<ResultTab>('perlu');
  const [dragOver, setDragOver] = useState<'db' | 'csv' | null>(null);

  const csvReady =
    csvHeaders.includes(NAMA_COL_DEFAULT) && csvHeaders.includes(TGL_COL_DEFAULT) && csvRows.length > 0;

  const inScope = useMemo(
    () => processed.filter((r) => /aktif|suspend/i.test(String(r.Status ?? ''))),
    [processed],
  );
  const stats = useMemo(
    () => ({
      sudah: inScope.filter((r) => r.kategori === 'Sudah Lapor').length,
      belum: inScope.filter((r) => r.kategori === 'Belum Lapor').length,
      hentikan: inScope.filter((r) => r.kategori === 'Hentikan Transfer').length,
      perlu: processed.filter((r) => r.apply && r.aksi).length,
    }),
    [inScope, processed],
  );

  const visibleRows = useMemo(() => {
    switch (resultTab) {
      case 'perlu':
        return processed.filter((r) => r.apply && r.aksi);
      case 'sudah':
        return inScope.filter((r) => r.kategori === 'Sudah Lapor');
      case 'belum':
        return inScope.filter((r) => r.kategori === 'Belum Lapor');
      case 'hentikan':
        return inScope.filter((r) => r.kategori === 'Hentikan Transfer');
      case 'semua':
        return inScope;
      default:
        return [];
    }
  }, [resultTab, processed, inScope]);

  const loadDatabase = async (file: File | null) => {
    if (!file) return;
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      let sheetName =
        wb.SheetNames.find((n) => /database\s*guru/i.test(n)) ??
        wb.SheetNames.find((n) => {
          const rows = XLSX.utils.sheet_to_json<GuruDbRow>(wb.Sheets[n]!, { defval: '' });
          return rows.length > 0 && 'ID_Guru' in rows[0]!;
        }) ??
        wb.SheetNames[0];
      if (!sheetName) throw new Error('File tidak punya sheet.');
      const rows = XLSX.utils.sheet_to_json<GuruDbRow>(wb.Sheets[sheetName]!, { defval: '' });
      if (!rows.length || !('Nama_Guru' in rows[0]!)) {
        throw new Error(`Sheet "${sheetName}" tidak punya kolom Nama_Guru.`);
      }
      let headers = Object.keys(rows[0]!);
      headers = ensureLastReportCol(rows, headers);
      setDb(rows);
      setDbHeaders(headers);
      setDbFileName(file.name);
      setDbSheetName(sheetName);
      toast.success(`${rows.length} guru terbaca dari ${file.name}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal membaca database');
    }
  };

  const loadCsv = async (file: File | null) => {
    if (!file) return;
    try {
      const text = await file.text();
      const { headers, rows } = parseCsvText(text);
      const hasNama = headers.includes(NAMA_COL_DEFAULT);
      const hasTgl = headers.includes(TGL_COL_DEFAULT);
      setCsvRows(rows);
      setCsvHeaders(headers);
      setCsvFileName(file.name);
      setCsvWarn(
        !hasNama || !hasTgl
          ? `Kolom "${NAMA_COL_DEFAULT}" / "${TGL_COL_DEFAULT}" tidak ditemukan. Kolom: ${headers.join(', ')}`
          : '',
      );
      if (hasNama && hasTgl) toast.success(`${rows.length} baris laporan terbaca`);
      else toast.error('Format CSV Typeform tidak lengkap');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal membaca CSV');
    }
  };

  const runProcess = () => {
    if (!processingMonth) {
      toast.error('Pilih bulan evaluasi dulu');
      return;
    }
    const result = processMonthlyReports({
      db,
      csvRows,
      processingMonth,
    });
    setProcessed(result.processed);
    setMatchedCount(result.matchedCount);
    setUnmatchedNames(result.unmatchedNames);
    setResultTab(result.processed.some((r) => r.apply && r.aksi) ? 'perlu' : 'belum');
    setStep(3);
  };

  const toggleApply = (idGuru: string, checked: boolean) => {
    setProcessed((prev) =>
      prev.map((r) => (String(r.ID_Guru) === idGuru ? { ...r, apply: checked } : r)),
    );
  };

  const downloadXlsx = () => {
    const { rows: outRows, headers: exportHeaders } = rowsForExport(processed, dbHeaders, processingMonth);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(outRows, { header: exportHeaders }),
      'Database Guru (Update)',
    );
    const logRows = processed
      .filter((r) => r.apply && r.aksi)
      .map((r) => ({
        ID_Guru: r.ID_Guru,
        Nama_Guru: r.Nama_Guru,
        Agent: r.Agent,
        Aksi: r.aksi === 'suspend' ? 'Suspend' : 'Reaktivasi',
        Bulan_Proses: processingMonth,
        Kategori: r.kategori,
      }));
    if (logRows.length) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(logRows), 'Log Perubahan Bulan Ini');
    }
    if (unmatchedNames.length) {
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(unmatchedNames.map((n) => ({ Nama_Di_CSV_Tidak_Cocok: n }))),
        'Nama Tidak Cocok',
      );
    }
    XLSX.writeFile(wb, `Database_Guru_Update_${processingMonth}.xlsx`);
  };

  const downloadHtml = () => {
    const sudah = inScope.filter((r) => r.kategori === 'Sudah Lapor');
    const belum = inScope.filter((r) => r.kategori === 'Belum Lapor');
    const hentikan = inScope.filter((r) => r.kategori === 'Hentikan Transfer');
    const esc = (s: unknown) =>
      String(s ?? '').replace(/[&<>"']/g, (m) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]!,
      );
    const rowsHtml = (list: ProcessedGuru[]) =>
      list.length === 0
        ? `<tr><td colspan="6">Tidak ada.</td></tr>`
        : list
            .map(
              (r) => `<tr>
        <td>${esc(r.ID_Guru)}</td><td>${esc(r.Nama_Guru)}</td><td>${esc(r.Agent)}</td>
        <td>${esc(r.Bank)}</td><td>${esc(r.No_Rekening)}</td><td>${esc(r.Bulan_Lapor_Terakhir || '-')}</td>
      </tr>`,
            )
            .join('');
    const html = `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8">
<title>Laporan Bulanan Guru - ${processingMonth}</title>
<style>
body{font-family:system-ui,sans-serif;background:#faf7f2;color:#2f302c;margin:0;padding:32px}
.wrap{max-width:1000px;margin:0 auto}h1{font-size:1.25rem} .sub{color:#758072;font-size:12px;margin-bottom:24px}
table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:8px}
th,td{padding:8px 10px;border-bottom:1px solid #e6d4c4;text-align:left}
.stat-grid{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px}
.stat{background:#fff;border:1px solid #e6d4c4;border-radius:10px;padding:14px 18px;min-width:140px}
.num{font-size:22px;font-weight:700}.ok{color:#059669}.warn{color:#d97706}.danger{color:#e11d48}
</style></head><body><div class="wrap">
<h1>Laporan Bulanan Guru — Program Bea Guru</h1>
<div class="sub">Bulan evaluasi: ${processingMonth} · Dibuat: ${new Date().toLocaleString('id-ID')}</div>
<div class="stat-grid">
  <div class="stat"><div class="num ok">${sudah.length}</div><div>Sudah Lapor</div></div>
  <div class="stat"><div class="num warn">${belum.length}</div><div>Belum Lapor</div></div>
  <div class="stat"><div class="num danger">${hentikan.length}</div><div>Hentikan Transfer</div></div>
</div>
<h2>✓ Sudah Lapor (${sudah.length})</h2>
<table><thead><tr><th>ID</th><th>Nama</th><th>Agent</th><th>Bank</th><th>Rekening</th><th>Bulan Lapor</th></tr></thead><tbody>${rowsHtml(sudah)}</tbody></table>
<h2>⚠ Belum Lapor (${belum.length})</h2>
<table><thead><tr><th>ID</th><th>Nama</th><th>Agent</th><th>Bank</th><th>Rekening</th><th>Lapor Terakhir</th></tr></thead><tbody>${rowsHtml(belum)}</tbody></table>
<h2>✕ Hentikan Transfer (${hentikan.length})</h2>
<table><thead><tr><th>ID</th><th>Nama</th><th>Agent</th><th>Bank</th><th>Rekening</th><th>Lapor Terakhir</th></tr></thead><tbody>${rowsHtml(hentikan)}</tbody></table>
</div></body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_Guru_${processingMonth}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const dropProps = (kind: 'db' | 'csv', onFile: (f: File | null) => void) => ({
    onDragEnter: (e: DragEvent) => {
      e.preventDefault();
      setDragOver(kind);
    },
    onDragOver: (e: DragEvent) => {
      e.preventDefault();
      setDragOver(kind);
    },
    onDragLeave: () => setDragOver(null),
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      setDragOver(null);
      void onFile(e.dataTransfer.files?.[0] ?? null);
    },
  });

  const tagVariant = (t: ProcessedGuru['tagClass']) =>
    t === 'ok' ? ('success' as const) : t === 'warn' ? ('warning' as const) : ('danger' as const);

  if (!active) return <div className={showTab(activeTab, ADMIN_MONTHLY_REPORT_OPS_TAB)} />;

  return (
    <div className={showTab(activeTab, ADMIN_MONTHLY_REPORT_OPS_TAB, 'fill')}>
      <PortalSectionHead
        title="Laporan Absen Guru (Ops)"
        description="Upload database + laporan Typeform → deteksi belum lapor / hentikan transfer. Diproses lokal di browser, tidak ke server."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {([1, 2, 3] as Step[]).map((n) => (
          <div
            key={n}
            className={`rounded-lg border px-3 py-2 text-xs font-medium ${
              step === n
                ? 'border-bea-copper bg-bea-ivory-light text-bea-ink'
                : step > n
                  ? 'border-emerald-300 text-emerald-700'
                  : 'border-bea-line text-bea-sage-muted'
            }`}
          >
            {step > n ? '✓ ' : `${n}. `}
            {n === 1 ? 'Upload Database' : n === 2 ? 'Upload Laporan' : 'Hasil & Unduh'}
          </div>
        ))}
      </div>

      {step === 1 ? (
        <Card className="space-y-4 p-4">
          <h3 className="font-semibold text-bea-ink">1. Upload Database Guru</h3>
          <p className="text-sm text-bea-sage-muted">
            File Excel (.xlsx). Kolom minimal: <strong>ID_Guru, Nama_Guru, Status</strong>. Kolom{' '}
            <strong>Bulan_Lapor_Terakhir</strong> dibuat otomatis jika belum ada.
          </p>
          <input
            ref={dbInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="sr-only"
            onChange={(e) => void loadDatabase(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            className={`flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-10 ${
              dragOver === 'db' ? 'border-bea-copper bg-bea-ivory-light' : 'border-bea-line bg-bea-ivory/40'
            }`}
            onClick={() => dbInputRef.current?.click()}
            {...dropProps('db', (f) => void loadDatabase(f))}
          >
            <FileSpreadsheet className="text-bea-copper" size={28} />
            <span className="font-semibold text-bea-ink">Klik atau seret file Database Guru (.xlsx)</span>
          </button>
          {dbFileName ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">
              <p className="font-medium text-bea-ink">{dbFileName}</p>
              <p className="text-xs text-bea-sage-muted">
                Sheet “{dbSheetName}” · {db.length} baris
              </p>
              <button
                type="button"
                className="mt-2 text-xs text-rose-700 underline"
                onClick={() => {
                  setDb([]);
                  setDbHeaders([]);
                  setDbFileName('');
                }}
              >
                Ganti file
              </button>
            </div>
          ) : null}
          <div className="flex justify-end">
            <Button disabled={db.length === 0} onClick={() => setStep(2)}>
              Lanjut →
            </Button>
          </div>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card className="space-y-4 p-4">
          <h3 className="font-semibold text-bea-ink">2. Upload Laporan Bulan Ini</h3>
          <p className="text-sm text-bea-sage-muted">
            CSV export Typeform “Update Guru”. Kolom: <code>{NAMA_COL_DEFAULT}</code> ·{' '}
            <code>{TGL_COL_DEFAULT}</code>.
          </p>
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(e) => void loadCsv(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            className={`flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-10 ${
              dragOver === 'csv' ? 'border-bea-copper bg-bea-ivory-light' : 'border-bea-line bg-bea-ivory/40'
            }`}
            onClick={() => csvInputRef.current?.click()}
            {...dropProps('csv', (f) => void loadCsv(f))}
          >
            <FileUp className="text-bea-copper" size={28} />
            <span className="font-semibold text-bea-ink">Klik atau seret file Laporan (.csv)</span>
          </button>
          {csvFileName ? (
            <div className="rounded-lg border border-bea-line bg-bea-ivory-light px-3 py-2 text-sm">
              <p className="font-medium">{csvFileName}</p>
              <p className="text-xs text-bea-sage-muted">{csvRows.length} baris respon</p>
              {csvWarn ? <p className="mt-1 text-xs text-amber-700">{csvWarn}</p> : null}
            </div>
          ) : null}
          <label className="block max-w-xs text-sm">
            <span className="mb-1 block text-xs font-medium text-bea-sage-muted">Bulan evaluasi status</span>
            <input
              type="month"
              className="w-full rounded-lg border border-bea-line bg-white px-3 py-2"
              value={processingMonth}
              onChange={(e) => setProcessingMonth(e.target.value)}
            />
          </label>
          <div className="flex justify-between gap-2">
            <Button variant="secondary" onClick={() => setStep(1)}>
              ← Kembali
            </Button>
            <Button disabled={!csvReady} onClick={runProcess}>
              Proses Laporan →
            </Button>
          </div>
        </Card>
      ) : null}

      {step === 3 ? (
        <Card className="space-y-4 p-4 mb-6">
          <h3 className="font-semibold text-bea-ink">3. Hasil Pemrosesan</h3>
          <p className="text-sm text-bea-sage-muted">
            Bulan evaluasi: <strong>{processingMonth}</strong> · {matchedCount} guru cocok
            {unmatchedNames.length ? ` · ${unmatchedNames.length} nama CSV tidak cocok` : ''}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard tone="green" label="Sudah Lapor" value={String(stats.sudah)} />
            <StatCard tone="amber" label="Belum Lapor" value={String(stats.belum)} />
            <StatCard tone="rose" label="Hentikan Transfer" value={String(stats.hentikan)} />
            <StatCard tone="default" label="Nama Tidak Cocok" value={String(unmatchedNames.length)} />
          </div>

          <div className="flex flex-wrap gap-1 border-b border-bea-line pb-1">
            {(
              [
                ['perlu', `Perlu Tindakan (${stats.perlu})`],
                ['sudah', `Sudah Lapor (${stats.sudah})`],
                ['belum', `Belum Lapor (${stats.belum})`],
                ['hentikan', `Hentikan Transfer (${stats.hentikan})`],
                ['semua', `Semua (${inScope.length})`],
                ['unmatch', `Tidak Cocok (${unmatchedNames.length})`],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setResultTab(key)}
                className={`rounded-t-lg px-3 py-2 text-xs font-medium ${
                  resultTab === key
                    ? 'bg-bea-ivory-light text-bea-ink border border-b-0 border-bea-line'
                    : 'text-bea-sage-muted hover:text-bea-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto rounded-lg border border-bea-line">
            {resultTab === 'unmatch' ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-bea-line text-left text-bea-sage-muted">
                    <th className="px-3 py-2">Nama (dari CSV, tidak ditemukan di database)</th>
                  </tr>
                </thead>
                <tbody>
                  {unmatchedNames.length === 0 ? (
                    <tr>
                      <td className="px-3 py-4 text-bea-sage-muted">Semua nama cocok dengan database.</td>
                    </tr>
                  ) : (
                    unmatchedNames.map((n) => (
                      <tr key={n} className="border-b border-bea-line/60">
                        <td className="px-3 py-2">{n}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-bea-line text-left text-bea-sage-muted">
                    {visibleRows.some((r) => r.aksi) ? <th className="px-2 py-2 w-8" /> : null}
                    <th className="px-3 py-2">ID</th>
                    <th className="px-3 py-2">Nama Guru</th>
                    <th className="px-3 py-2">Agent</th>
                    <th className="px-3 py-2">Bank / Rekening</th>
                    <th className="px-3 py-2">Bulan Terakhir Lapor</th>
                    <th className="px-3 py-2">Kategori</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-4 text-bea-sage-muted">
                        Tidak ada baris di kategori ini.
                      </td>
                    </tr>
                  ) : (
                    visibleRows.map((r) => (
                        <tr key={String(r.ID_Guru)} className="border-b border-bea-line/60">
                          {visibleRows.some((x) => x.aksi) ? (
                            <td className="px-2 py-2">
                              {r.aksi ? (
                                <input
                                  type="checkbox"
                                  checked={r.apply}
                                  title={r.aksi === 'suspend' ? 'akan Suspend' : 'akan Reaktivasi'}
                                  onChange={(e) => toggleApply(String(r.ID_Guru ?? ''), e.target.checked)}
                                />
                              ) : null}
                            </td>
                          ) : null}
                          <td className="px-3 py-2 font-mono text-xs text-bea-sage-muted">{r.ID_Guru}</td>
                          <td className="px-3 py-2 font-medium">{r.Nama_Guru}</td>
                          <td className="px-3 py-2 text-bea-sage-muted">{r.Agent}</td>
                          <td className="px-3 py-2 text-xs text-bea-sage-muted">
                            {r.Bank}
                            {r.No_Rekening ? ` · ${r.No_Rekening}` : ''}
                          </td>
                          <td className="px-3 py-2 font-mono text-xs">{r.Bulan_Lapor_Terakhir || '—'}</td>
                          <td className="px-3 py-2">
                            <Badge variant={tagVariant(r.tagClass)}>{r.kategori}</Badge>
                            {r.aksi ? (
                              <span className="ml-1 text-[10px] text-bea-sage-muted">
                                {r.aksi === 'suspend' ? 'akan Suspend' : 'akan Reaktivasi'}
                              </span>
                            ) : null}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          <p className="text-xs text-bea-sage-muted leading-relaxed">
            Centang guru di tab <strong>Perlu Tindakan</strong> untuk menerapkan Suspend / Reaktivasi
            sebelum diunduh. Yang tidak dicentang statusnya tidak berubah, tapi bulan laporan tetap
            ter-update kalau ada di file laporan.
          </p>

          <div className="flex flex-wrap justify-between gap-2">
            <Button variant="secondary" onClick={() => setStep(2)}>
              ← Kembali
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={downloadHtml}>
                Unduh Laporan (.html)
              </Button>
              <Button onClick={downloadXlsx}>Unduh Database Terupdate (.xlsx)</Button>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
