import { useRef, useState } from 'react';
import Card from '@core/ui/Card';
import Button from '@core/ui/Button';
import { showTab } from '@core/ui/tabPanel';
import { ADMIN_ANALYTICS_TAB } from '@core/constants/tabs';
import { formatPeriodLabel, formatRupiahJt, yAxisJt } from '@core/domain/formatMoney';
import { ANALYTICS_IMPORT_TEMPLATE } from '@core/domain/analyticsImport';
import { usePortalNav } from '@core/routing/usePortalNav';
import { useToast } from '@core/ui/toast/ToastProvider';
import { useAdminAnalytics } from '../../hooks/useAdminAnalytics';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
} from 'recharts';

const CHART_H = 280;
const BAR_DONATION = '#c9956a';
const BAR_TRANSFER = '#6b3a1f';
const LINE_CUM = '#8e3f16';
const LINE_TREND = '#b35428';

const tooltipStyle = {
  backgroundColor: '#1c1917',
  border: 'none',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '11px',
};

function KpiBox({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl px-4 py-3 text-center border ${
        highlight
          ? 'bg-bea-copper text-white border-bea-copper-dark'
          : 'bg-bea-ivory-light border-bea-line text-bea-ink'
      }`}
    >
      <p className={`text-[10px] font-semibold uppercase tracking-wide ${highlight ? 'text-white/90' : 'text-bea-sage-muted'}`}>
        {label}
      </p>
      <p className="text-lg font-bold mt-1 tabular-nums">{value}</p>
    </div>
  );
}

export function AdminAnalyticsTab() {
  const { activeTab } = usePortalNav();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const active = activeTab === ADMIN_ANALYTICS_TAB;
  const { data, loading, error, reload, importFile } = useAdminAnalytics(active);

  const handleImportFile = async (file: File | null) => {
    if (!file) return;
    setImporting(true);
    try {
      await importFile(file);
      toast.success(`${file.name} diimpor. Grafik diperbarui dari snapshot.`, 'Impor data');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Impor gagal.');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([ANALYTICS_IMPORT_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'template-analitik-bea-guru.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!active) return null;

  const months = data?.months ?? [];
  const summary = data?.summary;
  const period = data ? formatPeriodLabel(data.periodFrom, data.periodTo) : '';

  return (
    <div className={showTab(activeTab, ADMIN_ANALYTICS_TAB, 'fill')}>
      <div className="portal-scroll-pane space-y-5 flex-1 min-h-0 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-bea-copper">Program Bea Guru</p>
            <h2 className="font-serif text-xl font-semibold text-bea-ink">Grafik Donasi & Penyaluran</h2>
            <p className="text-xs text-bea-sage-muted mt-1 max-w-xl">
              Pantau tren donasi masuk, transfer ke guru, dan cadangan dana — data langsung dari program.
              {period ? ` Periode: ${period}.` : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls,.pdf,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/pdf"
              className="hidden"
              onChange={(e) => void handleImportFile(e.target.files?.[0] ?? null)}
            />
            <Button
              size="sm"
              variant="secondary"
              disabled={importing}
              onClick={() => fileRef.current?.click()}
            >
              {importing ? 'Mengimpor…' : 'Impor CSV / Excel / PDF'}
            </Button>
            <Button size="sm" variant="secondary" onClick={downloadTemplate}>
              Template CSV
            </Button>
            <Button size="sm" variant="secondary" onClick={() => void reload()} disabled={loading}>
              Muat ulang
            </Button>
          </div>
        </div>

        <p className="text-[10px] text-bea-sage-muted leading-relaxed -mt-2">
          Kolom: <code className="text-bea-ink">bulan</code> (2025-07-01 atau Jul 25),{' '}
          <code className="text-bea-ink">donatur</code>, <code className="text-bea-ink">donasi</code>,{' '}
          <code className="text-bea-ink">transfer</code>, <code className="text-bea-ink">guru</code> (opsional).
          PDF: ekspor laporan keuangan dengan tabel teks (bukan scan gambar).
        </p>

        {loading && (
          <Card className="portal-empty-state p-8 text-center text-bea-sage-muted text-sm">
            Memuat analitik…
          </Card>
        )}
        {error && (
          <Card className="p-4 text-sm text-red-700 border-red-200 bg-red-50" role="alert">
            {error}
          </Card>
        )}

        {!loading && data && (
          <>
            {/* 1. Donasi masuk per bulan */}
            <Card className="border p-4 md:p-5 bg-gradient-to-b from-bea-ivory to-white">
              <p className="text-[10px] font-bold uppercase text-bea-copper">Donasi Masuk per Bulan</p>
              <h3 className="font-serif text-lg font-semibold text-bea-ink mt-1">Program Bea Guru — Donasi Masuk</h3>
              <p className="text-xs text-bea-sage-muted mb-4">{period}</p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <KpiBox label="Total Donasi" value={formatRupiahJt(summary?.totalDonation ?? 0)} />
                <KpiBox label="Total Donatur" value={String(summary?.totalDonors ?? 0)} />
                <KpiBox label="Rata-rata/Bulan" value={formatRupiahJt(summary?.avgDonationPerMonth ?? 0)} highlight />
              </div>
              <ResponsiveContainer width="100%" height={CHART_H}>
                <ComposedChart data={months} margin={{ top: 20, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e0d5" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="left" tickFormatter={yAxisJt} tick={{ fontSize: 10 }} width={42} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={yAxisJt} tick={{ fontSize: 10 }} width={42} />
                  <Tooltip formatter={(v: number) => formatRupiahJt(v)} contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="donationAmount" name="Donasi per bulan" fill={BAR_DONATION} radius={[4, 4, 0, 0]}>
                    <LabelList
                      dataKey="donorCount"
                      position="top"
                      formatter={(v: number) => (v > 0 ? `${v} org` : '')}
                      style={{ fontSize: 9, fill: '#6b5344' }}
                    />
                  </Bar>
                  <Line yAxisId="right" type="monotone" dataKey="cumulativeDonation" name="Kumulatif donasi" stroke={LINE_CUM} strokeWidth={2} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
              <p className="text-[10px] text-bea-sage-muted mt-2 text-center">
                Total {summary?.totalDonationCount ?? 0} transaksi donasi terverifikasi — Program Bea Guru Indonesia
              </p>
            </Card>

            {/* 2. Pertumbuhan guru */}
            <Card className="border p-4 md:p-5">
              <p className="text-[10px] font-bold uppercase text-bea-copper">Bea Guru Indonesia</p>
              <h3 className="font-serif text-lg font-semibold text-bea-ink mt-1">Pertumbuhan Jumlah Guru Penerima</h3>
              <p className="text-xs text-bea-sage-muted mb-4">{period}</p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <KpiBox label="Awal Program" value={`${summary?.teachersStart ?? 0} guru`} />
                <KpiBox label="Terkini" value={`${summary?.teachersEnd ?? 0} guru`} />
                <KpiBox label="Pertumbuhan" value={`+${summary?.teacherGrowthPct ?? 0}%`} highlight />
              </div>
              <ResponsiveContainer width="100%" height={CHART_H}>
                <ComposedChart data={months} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e0d5" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar dataKey="teachersCumulative" name="Jumlah guru per bulan" fill="#e8b88a" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="teachersCumulative" name="Tren pertumbuhan" stroke={LINE_TREND} strokeWidth={2} strokeDasharray="6 4" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>

            {/* 3. Donasi vs transfer bulanan */}
            <Card className="border p-4 md:p-5">
              <p className="text-[10px] font-bold uppercase text-bea-copper">Program Bea Guru</p>
              <h3 className="font-serif text-lg font-semibold text-bea-ink mt-1">Donasi Masuk vs Transfer ke Guru</h3>
              <p className="text-xs text-bea-sage-muted mb-4">{period}</p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <KpiBox label="Total Donasi Masuk" value={formatRupiahJt(summary?.totalDonation ?? 0)} />
                <KpiBox label="Total Tersalurkan" value={formatRupiahJt(summary?.totalTransfer ?? 0)} highlight />
                <KpiBox label="Belum Tersalurkan" value={formatRupiahJt(summary?.undisbursed ?? 0)} />
              </div>
              <ResponsiveContainer width="100%" height={CHART_H}>
                <ComposedChart data={months} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e0d5" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={yAxisJt} tick={{ fontSize: 10 }} width={42} />
                  <Tooltip formatter={(v: number) => formatRupiahJt(v)} contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar dataKey="donationAmount" name="Donasi masuk" fill="#e8b88a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="transferAmount" name="Transfer ke guru" fill={BAR_TRANSFER} radius={[4, 4, 0, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>

            {/* 4. Kumulatif donasi vs transfer */}
            <Card className="border p-4 md:p-5">
              <p className="text-[10px] font-bold uppercase text-bea-copper">Program Bea Guru</p>
              <h3 className="font-serif text-lg font-semibold text-bea-ink mt-1">Kumulatif Donasi vs Transfer</h3>
              <p className="text-xs text-bea-sage-muted mb-4">{period}</p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <KpiBox label="Kumulatif Donasi" value={formatRupiahJt(summary?.totalDonation ?? 0)} />
                <KpiBox label="Kumulatif Transfer" value={formatRupiahJt(summary?.totalTransfer ?? 0)} highlight />
                <KpiBox label="Gap (Cadangan)" value={formatRupiahJt(summary?.undisbursed ?? 0)} />
              </div>
              <ResponsiveContainer width="100%" height={CHART_H}>
                <ComposedChart data={months} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e0d5" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={yAxisJt} tick={{ fontSize: 10 }} width={42} />
                  <Tooltip formatter={(v: number) => formatRupiahJt(v)} contentStyle={tooltipStyle} />
                  <Legend />
                  <Line type="monotone" dataKey="cumulativeDonation" name="Kumulatif donasi" stroke="#e8b88a" strokeWidth={2.5} dot={{ r: 3, fill: '#e8b88a' }} />
                  <Line type="monotone" dataKey="cumulativeTransfer" name="Kumulatif transfer ke guru" stroke={LINE_CUM} strokeWidth={2.5} dot={{ r: 3, fill: LINE_CUM }} />
                </ComposedChart>
              </ResponsiveContainer>
              <p className="text-[10px] text-bea-sage-muted mt-3 leading-relaxed">
                Gap antara donasi dan penyaluran mencerminkan dana yang masih dikelola yayasan. Impor CSV/Excel/PDF
                menimpa bulan tertentu — cocok untuk data historis sebelum platform.
              </p>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
