import { useEffect, useRef, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, FileUp } from 'lucide-react';
import Card from '@core/ui/Card';
import Button from '@core/ui/Button';
import Badge from '@core/ui/Badge';
import { PortalSectionHead } from '@core/ui/portal/PortalPrimitives';
import { showTab } from '@core/ui/tabPanel';
import { usePortalNav } from '@core/routing/usePortalNav';
import { useToast } from '@core/ui/toast/ToastProvider';
import { beaFieldLabel, beaInput, beaTextarea } from '@core/ui/beaTheme';
import { ADMIN_RECONCILIATION_TAB } from '@core/constants/tabs';
import {
  BankDirection,
  BankStatementUpload,
  BankTransactionLine,
  parseBankCsv,
  reconciliationService,
} from '../../services/reconciliationService';
import { parseJagoPdfFile } from '../../utils/jagoStatementParser';
import {
  formatIdrPlain,
  formatIdrSigned,
  jagoLineDisplay,
  jagoReviewSummary,
} from '../../utils/reconLineDisplay';

const statusVariant = (s: string) => {
  if (s === 'MATCHED' || s === 'COMPLETED') return 'success' as const;
  if (s === 'SUGGESTED' || s === 'REVIEW_NEEDED') return 'warning' as const;
  if (s === 'IGNORED') return 'neutral' as const;
  return 'danger' as const;
};

function guessDirectionFromName(name: string): BankDirection | null {
  const n = name.toLowerCase();
  if (/donasi|incoming|masuk/.test(n)) return 'INCOMING';
  if (/transfer|outgoing|keluar|penyaluran/.test(n)) return 'OUTGOING';
  return null;
}

export function AdminReconciliationTab() {
  const { activeTab } = usePortalNav();
  const toast = useToast();
  const active = activeTab === ADMIN_RECONCILIATION_TAB;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<BankStatementUpload[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lines, setLines] = useState<BankTransactionLine[]>([]);
  const [direction, setDirection] = useState<BankDirection>('INCOMING');
  const [fileName, setFileName] = useState('rekening-koran.csv');
  const [pickedLabel, setPickedLabel] = useState('');
  const [csvText, setCsvText] = useState('');
  const [showCsv, setShowCsv] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [donorLineId, setDonorLineId] = useState<string | null>(null);
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');

  const reload = async () => {
    const list = await reconciliationService.listUploads();
    setUploads(list);
  };

  useEffect(() => {
    if (!active) return;
    void reload().catch((e) => toast.error(e instanceof Error ? e.message : 'Gagal memuat rekonsiliasi'));
  }, [active]);

  useEffect(() => {
    if (!selectedId) {
      setLines([]);
      return;
    }
    void reconciliationService
      .listLines(selectedId)
      .then(setLines)
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Gagal memuat baris'));
  }, [selectedId]);

  const submitLines = async (
    name: string,
    dir: BankDirection,
    parsed: ReturnType<typeof parseBankCsv>,
    meta?: {
      periodStart?: string | null;
      periodEnd?: string | null;
      balanceAsOf?: string | null;
      latestBalance?: number | null;
    },
  ) => {
    if (parsed.length === 0) {
      toast.error('Tidak ada mutasi yang bisa diparse dari file.');
      return;
    }
    const upload = await reconciliationService.createUpload({
      fileName: name,
      direction: dir,
      lines: parsed,
      periodStart: meta?.periodStart,
      periodEnd: meta?.periodEnd,
      balanceAsOf: meta?.balanceAsOf,
      latestBalance: meta?.latestBalance,
    });
    toast.success(`${upload.matchedCount}/${upload.totalLines} baris cocok otomatis.`, 'Upload berhasil');
    setCsvText('');
    await reload();
    setSelectedId(upload.id);
  };

  const handlePdf = async (file: File | null) => {
    if (!file) return;
    if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') {
      toast.error('Hanya berkas PDF rekening koran Bank Jago yang didukung.');
      return;
    }
    const dir = guessDirectionFromName(file.name) ?? direction;
    setDirection(dir);
    setFileName(file.name);
    setPickedLabel(file.name);
    setLoading(true);
    try {
      const { lines: parsed, meta } = await parseJagoPdfFile(file, dir);
      if (parsed.length === 0) {
        toast.error(
          'Tidak ada mutasi Incoming/Outgoing Transfer. Cek arah (masuk/keluar) atau pastikan PDF punya lapisan teks (bukan scan gambar).',
        );
        return;
      }
      await submitLines(file.name, dir, parsed, meta);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal membaca PDF Jago');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    setLoading(true);
    try {
      await submitLines(fileName, direction, parseBankCsv(csvText));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload gagal');
    } finally {
      setLoading(false);
    }
  };

  const refreshLines = async () => {
    if (!selectedId) return;
    setLines(await reconciliationService.listLines(selectedId));
    await reload();
  };

  const period = jagoReviewSummary(
    lines,
    uploads.find((u) => u.id === selectedId) ?? null,
  );

  return (
    <div className={showTab(activeTab, ADMIN_RECONCILIATION_TAB, 'fill')}>
      <PortalSectionHead
        title="Rekonsiliasi rekening koran"
        description="Cocokkan mutasi bank dengan donasi masuk atau penyaluran ke guru."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4 space-y-4">
          <div>
            <h3 className="font-semibold text-bea-ink text-base">1. Unggah PDF rekening koran Bank Jago</h3>
            <p className="text-sm text-bea-sage-muted mt-1 leading-relaxed">
              Ambil file PDF dari aplikasi Jago (Pockets Transactions History). File Donasi = uang masuk; file Transfer = uang keluar.
            </p>
          </div>

          <fieldset className="space-y-2">
            <legend className={beaFieldLabel}>Pilih jenis mutasi</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => setDirection('INCOMING')}
                className={`flex flex-col items-start gap-2 rounded-2xl border-2 px-4 py-4 text-left transition-colors ${
                  direction === 'INCOMING'
                    ? 'border-emerald-600 bg-emerald-50'
                    : 'border-bea-line bg-white hover:border-emerald-400'
                }`}
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-full ${
                    direction === 'INCOMING' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  <ArrowDownLeft size={22} aria-hidden />
                </span>
                <span className="text-base font-semibold text-bea-ink">Uang masuk</span>
                <span className="text-sm text-bea-sage-muted leading-snug">
                  Donasi dari donatur ke yayasan. Pakai PDF <strong className="font-medium text-bea-ink">Donasi</strong>.
                </span>
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => setDirection('OUTGOING')}
                className={`flex flex-col items-start gap-2 rounded-2xl border-2 px-4 py-4 text-left transition-colors ${
                  direction === 'OUTGOING'
                    ? 'border-rose-600 bg-rose-50'
                    : 'border-bea-line bg-white hover:border-rose-400'
                }`}
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-full ${
                    direction === 'OUTGOING' ? 'bg-rose-600 text-white' : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  <ArrowUpRight size={22} aria-hidden />
                </span>
                <span className="text-base font-semibold text-bea-ink">Uang keluar</span>
                <span className="text-sm text-bea-sage-muted leading-snug">
                  Penyaluran ke guru. Pakai PDF <strong className="font-medium text-bea-ink">Transfer</strong>.
                </span>
              </button>
            </div>
            <p className="text-xs text-bea-sage-muted">
              Kalau nama file mengandung “Donasi” atau “Transfer”, pilihan ini biasanya ikut otomatis.
            </p>
          </fieldset>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            disabled={loading}
            onChange={(e) => void handlePdf(e.target.files?.[0] ?? null)}
          />

          <button
            type="button"
            disabled={loading}
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragOver(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              void handlePdf(e.dataTransfer.files?.[0] ?? null);
            }}
            className={`flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-4 py-10 text-center transition-colors ${
              dragOver
                ? 'border-bea-copper bg-bea-ivory-light'
                : 'border-bea-line bg-bea-ivory/40 hover:border-bea-copper/60 hover:bg-bea-ivory-light'
            } ${loading ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-bea-copper/15 text-bea-copper">
              <FileUp size={28} aria-hidden />
            </span>
            <span className="text-base font-semibold text-bea-ink">
              {loading ? 'Sedang memproses PDF…' : 'Klik di sini untuk pilih PDF'}
            </span>
            <span className="max-w-sm text-sm text-bea-sage-muted leading-relaxed">
              Atau tarik file PDF lalu lepaskan di kotak ini. Hanya file berakhiran .pdf.
            </span>
            {pickedLabel ? (
              <span className="mt-1 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-bea-ink border border-bea-line">
                File: {pickedLabel}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            className="text-sm text-bea-copper underline"
            onClick={() => setShowCsv((v) => !v)}
          >
            {showCsv ? 'Sembunyikan CSV manual' : 'Atau paste CSV manual (opsional)'}
          </button>
          {showCsv ? (
            <>
              <label className="block">
                <span className={beaFieldLabel}>Nama file</span>
                <input className={beaInput} value={fileName} onChange={(e) => setFileName(e.target.value)} />
              </label>
              <label className="block">
                <span className={beaFieldLabel}>CSV (tanggal,jumlah,nama,rekening,keterangan)</span>
                <textarea
                  className={beaTextarea}
                  rows={6}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="2026-07-01,500000,Budi,1234567890,Transfer donasi"
                />
              </label>
              <Button onClick={() => void handleUpload()} disabled={loading}>
                {loading ? 'Memproses…' : 'Upload CSV & auto-match'}
              </Button>
            </>
          ) : null}
        </Card>

        <Card className="p-4 space-y-3">
          <h3 className="font-semibold text-bea-ink text-base">2. Riwayat upload</h3>
          <p className="text-sm text-bea-sage-muted">Klik salah satu untuk melihat & meninjau baris di bawah.</p>
          {uploads.length === 0 ? (
            <p className="text-sm text-bea-sage-muted">Belum ada upload.</p>
          ) : (
            <ul className="space-y-2 max-h-80 overflow-auto">
              {uploads.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    className={`w-full text-left rounded-lg border px-3 py-2 ${
                      selectedId === u.id ? 'border-bea-copper bg-bea-ivory-light' : 'border-bea-line'
                    }`}
                    onClick={() => setSelectedId(u.id)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm">{u.fileName}</span>
                      <Badge variant={statusVariant(u.status)}>{u.status}</Badge>
                    </div>
                    <p className="text-xs text-bea-sage-muted mt-1">
                      {u.direction === 'INCOMING' ? 'Masuk' : 'Keluar'} · {u.matchedCount}/{u.totalLines} cocok
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {selectedId ? (
        <Card className="p-4 mt-4 mb-6">
          <h3 className="font-semibold text-bea-ink mb-1 text-base">3. Review baris</h3>
          {period ? (
            <div className="text-sm text-bea-sage-muted mb-3 leading-relaxed space-y-0.5">
              <p>
                Showing IDR transaction from {period.from} – {period.to}
              </p>
              {period.latestBalance != null && period.balanceAsOf ? (
                <p>
                  Latest Balance per {period.balanceAsOf}
                  <span className="mx-1.5 text-bea-line">·</span>
                  IDR {formatIdrPlain(period.latestBalance)}
                </p>
              ) : null}
              <p>
                {period.count.toLocaleString('id-ID')} transaksi
                <span className="mx-1.5 text-bea-line">·</span>
                {period.matched}/{period.count} cocok
              </p>
            </div>
          ) : (
            <p className="text-sm text-bea-sage-muted mb-3">Belum ada mutasi di upload ini.</p>
          )}
          {lines.length === 0 ? (
            <p className="text-sm text-bea-sage-muted">Tidak ada transaksi yang menunggu tinjauan.</p>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-bea-sage-muted border-b border-bea-line">
                  <th className="py-2 pr-3 whitespace-nowrap">Date & Time</th>
                  <th className="py-2 pr-3">Source/Destination</th>
                  <th className="py-2 pr-3">Transaction Details</th>
                  <th className="py-2 pr-3">Notes</th>
                  <th className="py-2 pr-3 text-right whitespace-nowrap">Amount</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => {
                  const canConfirm =
                    line.matchStatus === 'SUGGESTED' ||
                    Boolean(line.suggestedDonationId || line.suggestedLedgerId);
                  const d = jagoLineDisplay(line);
                  return (
                  <tr key={line.id} className="border-b border-bea-line/60 align-top">
                    <td className="py-2.5 pr-3 whitespace-nowrap">
                      <div className="text-bea-ink">{d.dateLabel}</div>
                      {d.time ? <div className="text-xs text-bea-sage-muted">{d.time}</div> : null}
                    </td>
                    <td className="py-2.5 pr-3 min-w-[10rem]">
                      <div className="font-medium text-bea-ink">{line.counterpartyName || '—'}</div>
                      <div className="text-xs text-bea-sage-muted leading-snug">
                        {[d.bank, line.counterpartyAccount].filter(Boolean).join(' ')}
                      </div>
                    </td>
                    <td className="py-2.5 pr-3">
                      <div>{d.detail}</div>
                      {d.txnId ? <div className="text-xs text-bea-sage-muted">ID# {d.txnId}</div> : null}
                    </td>
                    <td className="py-2.5 pr-3 text-bea-sage-muted">{d.notes || '—'}</td>
                    <td
                      className={`py-2.5 pr-3 text-right tabular-nums font-medium whitespace-nowrap ${
                        line.direction === 'OUTGOING' ? 'text-rose-700' : 'text-emerald-700'
                      }`}
                    >
                      {formatIdrSigned(line.amount, line.direction)}
                    </td>
                    <td className="py-2.5 pr-3">
                      <Badge variant={statusVariant(line.matchStatus)}>{line.matchStatus}</Badge>
                    </td>
                    <td className="py-2.5">
                      {line.matchStatus === 'MATCHED' || line.matchStatus === 'IGNORED' ? (
                        <span className="text-xs text-bea-sage-muted">Selesai</span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {line.suggestedDonorUserId && !line.suggestedDonationId ? (
                            <Button
                              size="sm"
                              onClick={() =>
                                void reconciliationService
                                  .confirmSuggestedDonor(line.id)
                                  .then(refreshLines)
                                  .then(() =>
                                    toast.success('Donasi baru dari donatur dikenal tercatat terverifikasi'),
                                  )
                                  .catch((e) => toast.error(e instanceof Error ? e.message : 'Gagal'))
                              }
                            >
                              Catat donasi
                            </Button>
                          ) : canConfirm ? (
                            <Button
                              size="sm"
                              onClick={() =>
                                void reconciliationService
                                  .confirmLine(line.id)
                                  .then(refreshLines)
                                  .then(() => toast.success('Kecocokan dikonfirmasi'))
                                  .catch((e) => toast.error(e instanceof Error ? e.message : 'Gagal'))
                              }
                            >
                              {line.direction === 'OUTGOING' ? 'Konfirmasi penyaluran' : 'Konfirmasi'}
                            </Button>
                          ) : null}
                          {line.direction === 'INCOMING' && line.matchStatus === 'UNMATCHED' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setDonorLineId(line.id);
                                setDonorName(line.counterpartyName || '');
                                setDonorEmail('');
                              }}
                            >
                              Buat donatur
                            </Button>
                          ) : null}
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              void reconciliationService
                                .ignoreLine(line.id)
                                .then(refreshLines)
                                .then(() => toast.success('Baris diabaikan (biaya/admin/dll)'))
                                .catch((e) => toast.error(e instanceof Error ? e.message : 'Gagal'))
                            }
                          >
                            Abaikan
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          )}
        </Card>
      ) : null}

      {donorLineId ? (
        <Card className="p-4 mt-4 space-y-3 max-w-lg">
          <h3 className="font-semibold text-bea-ink">Buat donatur dari mutasi walk-in</h3>
          <p className="text-sm text-bea-sage-muted">
            Rekening pengirim akan disimpan agar transfer berikutnya bisa dicocokkan otomatis.
          </p>
          <label className="block">
            <span className={beaFieldLabel}>Nama</span>
            <input className={beaInput} value={donorName} onChange={(e) => setDonorName(e.target.value)} />
          </label>
          <label className="block">
            <span className={beaFieldLabel}>Email</span>
            <input
              className={beaInput}
              type="email"
              value={donorEmail}
              onChange={(e) => setDonorEmail(e.target.value)}
              placeholder="donatur@email.com"
            />
          </label>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (!donorName.trim() || !donorEmail.trim()) {
                  toast.error('Nama dan email donatur wajib diisi');
                  return;
                }
                void reconciliationService
                  .createDonorFromLine(donorLineId, {
                    donorName: donorName.trim(),
                    email: donorEmail.trim(),
                  })
                  .then(refreshLines)
                  .then(() => {
                    toast.success('Akun donatur baru dibuat & donasi tercatat terverifikasi');
                    setDonorLineId(null);
                  })
                  .catch((e) => toast.error(e instanceof Error ? e.message : 'Gagal'));
              }}
            >
              Simpan
            </Button>
            <Button variant="secondary" onClick={() => setDonorLineId(null)}>
              Batal
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
