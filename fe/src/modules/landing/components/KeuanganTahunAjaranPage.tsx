import { useMemo, useRef, type ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useReducedMotion } from 'motion/react';
import { usePageMeta } from '@core/hooks/usePageMeta';
import { PAGE_META } from '@core/constants/siteMeta';
import { formatRupiahJt, yAxisJt } from '@core/domain/formatMoney';
import { RevealOnScroll } from '@core/ui/RevealOnScroll';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
} from 'recharts';
import {
  buildKeuanganChartRows,
  KEUANGAN_TA_2025_2026,
} from '../data/keuanganTahunAjaran2025';
import { LandingPublicHeader } from './LandingPublicHeader';
import { PublicTermsDialog } from '@modules/legal/components/PublicTermsDialog';

const CHART_H = 300;
const CREAM = '#D99B6E';
const TERRA = '#B5572A';
const DARK = '#8A3A1B';
const CHART_ANIM_MS = 1000;

const tooltipStyle = {
  backgroundColor: DARK,
  border: 'none',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '11px',
};

const chartAnim = {
  duration: CHART_ANIM_MS,
  easing: 'ease-out' as const,
};

function ChartWhenVisible({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const reduce = useReducedMotion();

  return (
    <div ref={ref} className="keuangan-chart-slot">
      {inView || reduce ? (
        children
      ) : (
        <div className="keuangan-chart-slot--pending h-full w-full" aria-hidden />
      )}
    </div>
  );
}

function Kpi({
  label,
  value,
  accent,
  delay = 0,
}: {
  label: string;
  value: string;
  accent?: boolean;
  delay?: number;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={`rounded-xl border px-4 py-3 flex-1 min-w-[120px] text-center ${
        accent ? 'border-terra bg-terra text-white' : 'border-[#E0BFA0] bg-[#F4E3D3]'
      }`}
      style={accent ? { backgroundColor: TERRA, borderColor: TERRA } : undefined}
      initial={reduce ? false : { opacity: 0, y: 10, scale: 0.97 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.45, delay: delay / 1000, ease: [0.16, 1, 0.3, 1] }}
    >
      <p
        className={`text-[11px] font-medium ${accent ? 'text-[#F4E3D3]' : 'text-[#B5572A]'}`}
      >
        {label}
      </p>
      <p className={`text-lg font-bold mt-1 tabular-nums ${accent ? 'text-white' : 'text-[#8A3A1B]'}`}>
        {value}
      </p>
    </motion.div>
  );
}

function ReportCard({
  title,
  description,
  children,
  note,
  delay = 0,
}: {
  title: string;
  description: string;
  children: ReactNode;
  note?: string;
  delay?: number;
}) {
  return (
    <RevealOnScroll delay={delay}>
      <article className="rounded-2xl border border-[#E8D5C4] bg-[#FBF1E7] p-6 md:p-7 shadow-sm max-w-3xl mx-auto">
        <div className="flex items-center gap-3 pb-4 mb-5 border-b-2 border-[#D99B6E]">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[#B5572A] bg-[#F4E3D3] text-xl"
            aria-hidden
          >
            📚
          </span>
          <div>
            <h2 className="text-base font-bold text-[#8A3A1B]">{title}</h2>
            <p className="text-[11px] text-[#B5572A] mt-0.5">{description}</p>
          </div>
        </div>
        {children}
        {note ? (
          <p className="text-[11px] text-[#B5572A] text-center mt-3 italic leading-relaxed">{note}</p>
        ) : null}
      </article>
    </RevealOnScroll>
  );
}

interface KeuanganTahunAjaranPageProps {
  onSwitchToAuth: () => void;
}

export function KeuanganTahunAjaranPage({ onSwitchToAuth }: KeuanganTahunAjaranPageProps) {
  usePageMeta(PAGE_META.keuanganTa2025);

  const rows = useMemo(() => buildKeuanganChartRows(), []);
  const { summary } = KEUANGAN_TA_2025_2026;
  const reduce = useReducedMotion();
  const [termsOpen, setTermsOpen] = useState(false);

  return (
    <div className="landing-page relative min-h-[100dvh] bg-[#F5EDE4] text-[#3A1A08]">
      <div className="landing-grain pointer-events-none fixed inset-0 z-[1]" aria-hidden />
      <LandingPublicHeader
        onSwitchToAuth={onSwitchToAuth}
        onOpenTerms={() => setTermsOpen(true)}
        termsOpen={termsOpen}
      />

      <main className="relative z-[2] mx-auto max-w-4xl px-4 py-8 md:py-12 space-y-8">
        <header className="keuangan-page-title text-center max-w-2xl mx-auto">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#B5572A]">
            Transparansi Keuangan
          </p>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-[#8A3A1B] mt-2">
            {KEUANGAN_TA_2025_2026.pageTitle}
          </h1>
          <p className="text-sm text-[#B5572A] mt-2 leading-relaxed">
            {KEUANGAN_TA_2025_2026.programTitle}
          </p>
          <p className="text-xs text-[#B5572A]/90 mt-1">{KEUANGAN_TA_2025_2026.subtitle}</p>
        </header>

        <ReportCard
          title="Grafik 1 — Donasi Masuk per Bulan"
          description="Nominal donasi bulanan + jumlah donatur + tren kumulatif"
          delay={0.05}
        >
          <div className="flex flex-wrap gap-2 mb-5">
            <Kpi label="Total Donasi" value={formatRupiahJt(summary.totalDonasi)} accent delay={80} />
            <Kpi label="Total Donatur" value={String(summary.totalDonatur)} delay={140} />
            <Kpi label="Rata-rata/Bulan" value={formatRupiahJt(summary.avgPerMonth)} delay={200} />
          </div>
          <ChartWhenVisible>
            <ResponsiveContainer width="100%" height={CHART_H}>
              <ComposedChart data={rows} margin={{ top: 24, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#888780' }} axisLine={{ stroke: 'rgba(0,0,0,0.1)' }} tickLine={false} />
                <YAxis
                  yAxisId="left"
                  tickFormatter={yAxisJt}
                  tick={{ fontSize: 10, fill: '#888780' }}
                  width={40}
                  domain={[0, 80_000_000]}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={yAxisJt}
                  tick={{ fontSize: 10, fill: DARK }}
                  width={40}
                  domain={[0, 340_000_000]}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number, name: string) => [
                    formatRupiahJt(v),
                    name === 'donasi' ? 'Donasi bulanan' : 'Kumulatif',
                  ]}
                />
                <Bar
                  yAxisId="left"
                  dataKey="donasi"
                  name="donasi"
                  fill={CREAM}
                  radius={[5, 5, 0, 0]}
                  isAnimationActive={!reduce}
                  animationDuration={chartAnim.duration}
                  animationEasing={chartAnim.easing}
                  activeBar={{ fill: TERRA }}
                >
                  <LabelList
                    dataKey="donatur"
                    position="top"
                    formatter={(v: number) => `${v} org`}
                    style={{ fontSize: 9, fontWeight: 700, fill: DARK }}
                  />
                </Bar>
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="cumulativeDonation"
                  stroke="none"
                  fill="rgba(138,58,27,0.07)"
                  isAnimationActive={!reduce}
                  animationDuration={chartAnim.duration + 200}
                  animationEasing={chartAnim.easing}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cumulativeDonation"
                  stroke={DARK}
                  strokeWidth={2}
                  dot={{ r: 3, fill: DARK }}
                  isAnimationActive={!reduce}
                  animationDuration={chartAnim.duration + 200}
                  animationEasing={chartAnim.easing}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartWhenVisible>
          <div className="flex flex-wrap justify-center gap-4 mt-3 text-[11px] text-[#8A3A1B]">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ background: CREAM }} />
              Donasi per bulan (sumbu kiri)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5" style={{ background: DARK }} />
              Kumulatif donasi (sumbu kanan)
            </span>
            <span>👤 Jumlah donatur (label atas batang)</span>
          </div>
        </ReportCard>

        <ReportCard
          title="Grafik 2 — Donasi Masuk vs Transfer ke Guru per Bulan"
          description="Perbandingan nominal donasi diterima dan dana tersalurkan ke guru setiap bulan"
          note={summary.chart2Note}
          delay={0.1}
        >
          <div className="flex flex-wrap gap-2 mb-5">
            <Kpi label="Total Donasi Masuk" value={formatRupiahJt(summary.totalDonasi)} accent delay={80} />
            <Kpi label="Total Tersalurkan ke Guru" value={formatRupiahJt(summary.totalTransfer)} accent delay={140} />
            <Kpi label="Selisih / Cadangan" value={formatRupiahJt(summary.gap)} delay={200} />
          </div>
          <ChartWhenVisible>
            <ResponsiveContainer width="100%" height={CHART_H}>
              <ComposedChart data={rows} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#888780' }} axisLine={{ stroke: 'rgba(0,0,0,0.1)' }} tickLine={false} />
                <YAxis
                  tickFormatter={yAxisJt}
                  tick={{ fontSize: 10, fill: '#888780' }}
                  width={40}
                  domain={[0, 80_000_000]}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatRupiahJt(v)} />
                <Bar
                  dataKey="donasi"
                  name="Donasi masuk"
                  fill={CREAM}
                  radius={[5, 5, 0, 0]}
                  isAnimationActive={!reduce}
                  animationDuration={chartAnim.duration}
                  animationEasing={chartAnim.easing}
                  activeBar={{ fill: '#C47E4F' }}
                />
                <Bar
                  dataKey="transfer"
                  name="Transfer ke guru"
                  fill={TERRA}
                  radius={[5, 5, 0, 0]}
                  isAnimationActive={!reduce}
                  animationDuration={chartAnim.duration}
                  animationBegin={120}
                  animationEasing={chartAnim.easing}
                  activeBar={{ fill: DARK }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartWhenVisible>
          <div className="flex flex-wrap justify-center gap-4 mt-3 text-[11px] text-[#8A3A1B]">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ background: CREAM }} />
              Donasi masuk
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ background: TERRA }} />
              Transfer ke guru
            </span>
          </div>
        </ReportCard>

        <ReportCard
          title="Grafik 3 — Kumulatif Donasi vs Kumulatif Transfer ke Guru"
          description="Perbandingan akumulasi donasi dan penyaluran dari bulan ke bulan"
          note={summary.chart3Note}
          delay={0.15}
        >
          <div className="flex flex-wrap gap-2 mb-5">
            <Kpi label="Kumulatif Donasi (Jun 2026)" value={formatRupiahJt(summary.totalDonasi)} accent delay={80} />
            <Kpi label="Kumulatif Transfer (Jun 2026)" value={formatRupiahJt(summary.totalTransfer)} accent delay={140} />
            <Kpi label="Gap (Dana Dikelola)" value={formatRupiahJt(summary.gap)} delay={200} />
          </div>
          <ChartWhenVisible>
            <ResponsiveContainer width="100%" height={CHART_H}>
              <ComposedChart data={rows} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#888780' }} axisLine={{ stroke: 'rgba(0,0,0,0.1)' }} tickLine={false} />
                <YAxis
                  tickFormatter={yAxisJt}
                  tick={{ fontSize: 10, fill: '#888780' }}
                  width={40}
                  domain={[0, 340_000_000]}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatRupiahJt(v)} />
                <Area
                  type="monotone"
                  dataKey="cumulativeTransfer"
                  stackId="cum"
                  stroke="none"
                  fill="rgba(181,87,42,0.08)"
                  isAnimationActive={!reduce}
                  animationDuration={chartAnim.duration}
                  animationEasing={chartAnim.easing}
                />
                <Area
                  type="monotone"
                  dataKey="gapBand"
                  stackId="cum"
                  stroke="none"
                  fill="rgba(217,155,110,0.25)"
                  isAnimationActive={!reduce}
                  animationDuration={chartAnim.duration + 150}
                  animationEasing={chartAnim.easing}
                />
                <Line
                  type="monotone"
                  dataKey="cumulativeDonation"
                  name="Kumulatif donasi"
                  stroke={CREAM}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: CREAM }}
                  isAnimationActive={!reduce}
                  animationDuration={chartAnim.duration + 200}
                  animationEasing={chartAnim.easing}
                />
                <Line
                  type="monotone"
                  dataKey="cumulativeTransfer"
                  name="Kumulatif transfer ke guru"
                  stroke={TERRA}
                  strokeWidth={2.5}
                  strokeDasharray="6 3"
                  dot={{ r: 3, fill: TERRA }}
                  isAnimationActive={!reduce}
                  animationDuration={chartAnim.duration + 280}
                  animationEasing={chartAnim.easing}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartWhenVisible>
          <div className="flex flex-wrap justify-center gap-4 mt-3 text-[11px] text-[#8A3A1B]">
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5" style={{ background: CREAM }} />
              Kumulatif donasi
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 border-b-2 border-dashed" style={{ borderColor: TERRA }} />
              Kumulatif transfer ke guru
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#D99B6E]/25 border border-[#D99B6E]" />
              Dana belum disalurkan
            </span>
          </div>
        </ReportCard>

        <RevealOnScroll delay={0.2}>
          <footer className="text-center text-[11px] text-[#B5572A] pb-8">
            <p>{KEUANGAN_TA_2025_2026.footer}</p>
            <Link to="/" className="mt-3 inline-block font-semibold text-[#8A3A1B] hover:underline">
              ← Kembali ke Beranda
            </Link>
          </footer>
        </RevealOnScroll>
      </main>
      <PublicTermsDialog open={termsOpen} onClose={() => setTermsOpen(false)} />
    </div>
  );
}
