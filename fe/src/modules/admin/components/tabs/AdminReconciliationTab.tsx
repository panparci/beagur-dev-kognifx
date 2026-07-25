import { useEffect, useState } from 'react';
import Card from '@core/ui/Card';
import Button from '@core/ui/Button';
import Badge from '@core/ui/Badge';
import { PortalSectionHead } from '@core/ui/portal/PortalPrimitives';
import { showTab } from '@core/ui/tabPanel';
import { usePortalNav } from '@core/routing/usePortalNav';
import { useToast } from '@core/ui/toast/ToastProvider';
import { beaFieldLabel, beaInput, beaSelect, beaTextarea } from '@core/ui/beaTheme';
import { ADMIN_RECONCILIATION_TAB } from '@core/constants/tabs';
import {
  BankDirection,
  BankStatementUpload,
  BankTransactionLine,
  parseBankCsv,
  reconciliationService,
} from '../../services/reconciliationService';
import { parseJagoPdfFile } from '../../utils/jagoStatementParser';

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
  const [uploads, setUploads] = useState<BankStatementUpload[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lines, setLines] = useState<BankTransactionLine[]>([]);
  const [direction, setDirection] = useState<BankDirection>('INCOMING');
  const [fileName, setFileName] = useState('rekening-koran.csv');
  const [csvText, setCsvText] = useState('');
  const [showCsv, setShowCsv] = useState(false);
  const [loading, setLoading] = useState(false);
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

  const submitLines = async (name: string, dir: BankDirection, parsed: ReturnType<typeof parseBankCsv>) => {
    if (parsed.length === 0) {
      toast.error('Tidak ada mutasi yang bisa diparse dari file.');
      return;
    }
    const upload = await reconciliationService.createUpload({ fileName: name, direction: dir, lines: parsed });
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
    setLoading(true);
    try {
      const parsed = await parseJagoPdfFile(file, dir);
      if (parsed.length === 0) {
        toast.error(
          'Tidak ada mutasi Incoming/Outgoing Transfer. Cek arah (masuk/keluar) atau pastikan PDF punya lapisan teks (bukan scan gambar).',
        );
        return;
      }
      await submitLines(file.name, dir, parsed);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal membaca PDF Jago');
    } finally {
      setLoading(false);
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

  return (
    <div className={showTab(activeTab, ADMIN_RECONCILIATION_TAB, 'fill')}>
      <PortalSectionHead
        title="Rekonsiliasi rekening koran"
        description="Cocokkan mutasi bank dengan donasi masuk atau penyaluran ke guru."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4 space-y-3">
          <h3 className="font-semibold text-bea-ink">Upload rekening koran (Bank Jago PDF)</h3>
          <p className="text-sm text-bea-sage-muted">
            Format Pockets Transactions History. Pocket Donasi → masuk; Transfer → keluar. Movement antar pocket diabaikan.
          </p>
          <label className="block">
            <span className={beaFieldLabel}>Arah (otomatis dari nama file bila bisa)</span>
            <select className={beaSelect} value={direction} onChange={(e) => setDirection(e.target.value as BankDirection)}>
              <option value="INCOMING">Masuk (donatur → yayasan)</option>
              <option value="OUTGOING">Keluar (yayasan → guru)</option>
            </select>
          </label>
          <label className="block">
            <span className={beaFieldLabel}>PDF Jago</span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              className={beaInput}
              disabled={loading}
              onChange={(e) => void handlePdf(e.target.files?.[0] ?? null)}
            />
          </label>
          <button
            type="button"
            className="text-sm text-bea-copper underline"
            onClick={() => setShowCsv((v) => !v)}
          >
            {showCsv ? 'Sembunyikan CSV manual' : 'Atau paste CSV manual'}
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
          {loading ? <p className="text-sm text-bea-sage-muted">Memproses file…</p> : null}
        </Card>

        <Card className="p-4 space-y-3">
          <h3 className="font-semibold text-bea-ink">Riwayat upload</h3>
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
        <Card className="p-4 mt-4">
          <h3 className="font-semibold text-bea-ink mb-3">Review baris</h3>
          {lines.length === 0 ? (
            <p className="text-sm text-bea-sage-muted">Tidak ada transaksi yang menunggu tinjauan.</p>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-bea-sage-muted border-b border-bea-line">
                  <th className="py-2 pr-2">Tanggal</th>
                  <th className="py-2 pr-2">Jumlah</th>
                  <th className="py-2 pr-2">Lawan transaksi</th>
                  <th className="py-2 pr-2">Status</th>
                  <th className="py-2">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => {
                  const canConfirm =
                    line.matchStatus === 'SUGGESTED' ||
                    Boolean(line.suggestedDonationId || line.suggestedLedgerId);
                  return (
                  <tr key={line.id} className="border-b border-bea-line/60">
                    <td className="py-2 pr-2 whitespace-nowrap">{line.transactionDate}</td>
                    <td className="py-2 pr-2 tabular-nums">Rp {line.amount.toLocaleString('id-ID')}</td>
                    <td className="py-2 pr-2">
                      <div>{line.counterpartyName || '—'}</div>
                      <div className="text-xs text-bea-sage-muted">{line.counterpartyAccount}</div>
                    </td>
                    <td className="py-2 pr-2">
                      <Badge variant={statusVariant(line.matchStatus)}>{line.matchStatus}</Badge>
                    </td>
                    <td className="py-2">
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
