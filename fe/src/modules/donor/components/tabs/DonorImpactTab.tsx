import Card from '@core/ui/Card';
import Button from '@core/ui/Button';
import Badge from '@core/ui/Badge';
import StatCard, { StatGrid } from '@core/ui/StatCard';
import { PortalSectionHead } from '@core/ui/portal/PortalPrimitives';
import { beaSectionTitle } from '@core/ui/beaTheme';
import { showTab } from '@core/ui/tabPanel';
import {
  Award,
  Calendar,
  CheckCircle2,
  Heart,
  Printer,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useEffect } from 'react';
import { usePortalNav } from '@core/routing/usePortalNav';
import { useDonorDashboardContext } from '../../context/DonorDashboardContext';

const CHART_HEIGHT = 260;

function formatDonationShort(amount: number): string {
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)}jt`;
  if (amount >= 1_000) return `Rp ${Math.round(amount / 1_000)}k`;
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

export function DonorImpactTab() {
  const { activeTab: currentActiveTab } = usePortalNav();
  const {
    user,
    setIsCertificateOpen,
    totalDonationAmount,
    hoursSupported,
    estimatedStudentsImpacted,
    directSponsorCount,
    recurringDonationCount,
    philLevel,
    monthlyTrendData,
    allocationData,
    hasDonationActivity,
    pageLoading,
    reloadDashboard,
  } = useDonorDashboardContext();

  useEffect(() => {
    if (currentActiveTab === 'Jejak Philanthropy') {
      void reloadDashboard();
    }
  }, [currentActiveTab, reloadDashboard]);

  return (
    <div className={showTab(currentActiveTab, 'Jejak Philanthropy', 'fill')}>
      <div className="portal-scroll-pane space-y-4 flex-1 min-h-0 text-sm">
        <Card variant="soft" className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-bea-copper/10 text-bea-copper rounded-2xl border border-bea-line">
              <Award size={36} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-bea-copper">
                  Jejak Kontribusi Kebaikan
                </span>
                <Badge variant="success" className="text-[9px] px-2 py-0.5 font-bold uppercase">
                  {philLevel.label}
                </Badge>
              </div>
              <h2 className={`${beaSectionTitle} text-xl md:text-2xl mt-1`}>
                Halo, {user.name || 'Donatur Hebat'}!
              </h2>
              <p className="text-xs text-bea-sage-muted mt-1 max-w-xl leading-relaxed">
                Anda berada di tingkat{' '}
                <span className="font-extrabold text-bea-copper-dark">{philLevel.title}</span>. Teruskan
                kontribusi Anda untuk membantu meringankan beban finansial para pendidik berdedikasi mulia.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-3">
            <Button onClick={() => setIsCertificateOpen(true)} size="sm" className="text-xs py-3 px-4 tracking-wider uppercase">
              <Printer size={14} />
              Lihat Sertifikat Apresiasi
            </Button>
          </div>
        </Card>

        <StatGrid>
          <StatCard tone="copper" label="Total Donasi Salur" value={`Rp ${totalDonationAmount.toLocaleString('id-ID')}`} />
          <StatCard tone="default" label="Jam Kelas Tersokong" value={`${hoursSupported} Jam`} />
          <StatCard tone="green" label="Siswa Terdampak" value={`± ${estimatedStudentsImpacted} Anak`} />
          <StatCard tone="amber" label="Guru Asuh Terhubung" value={`${directSponsorCount} Pendidik`} />
        </StatGrid>

        <div className="portal-donor-chart-grid">
          <Card className="portal-donor-chart border h-full">
            <div className="flex justify-between items-center mb-1">
              <h3 className={`${beaSectionTitle} flex items-center gap-2 text-sm`}>
                <TrendingUp size={16} className="text-bea-copper-dark" />
                Tren Kontribusi & Pertumbuhan Saluran
              </h3>
              <Badge variant="success">2026 Timeline</Badge>
            </div>
            <p className="portal-section-desc mb-3">
              Kurva grafik di bawah ini menggambarkan jumlah donasi bulanan dan akumulasi total sumbangan
              yang Anda salurkan sepanjang periode tahun berjalan.
            </p>
            <div className="portal-donor-chart-canvas text-xs">
              {pageLoading ? (
                <div className="portal-donor-chart-empty" aria-busy="true">
                  Memuat tren donasi…
                </div>
              ) : !hasDonationActivity ? (
                <div className="portal-donor-chart-empty">
                  Belum ada donasi tercatat. Grafik akan aktif setelah transfer pertama Anda
                  tersinkron.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                  <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDonasi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#b75a22" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#b75a22" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorAkumulasi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8e3f16" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#8e3f16" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-bea-line" />
                  <XAxis dataKey="month" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#888888"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `Rp ${value / 1000}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => [`Rp ${Number(value).toLocaleString('id-ID')}`, '']}
                    contentStyle={{
                      backgroundColor: '#1c1917',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Area
                    type="monotone"
                    dataKey="Donasi Bulanan"
                    stroke="#0d9488"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorDonasi)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Akumulasi Saluran"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorAkumulasi)"
                  />
                </AreaChart>
              </ResponsiveContainer>
              )}
            </div>
          </Card>

          <Card className="portal-donor-chart border h-full flex flex-col">
            <div>
              <div className="flex justify-between items-center mb-1">
                <h3 className={`${beaSectionTitle} flex items-center gap-2 text-sm`}>
                  <ShieldCheck size={16} className="text-bea-copper" />
                  Rencana & Alokasi Penyerapan Dana
                </h3>
                <Badge variant="warning">Transparansi 100%</Badge>
              </div>
              <p className="portal-section-desc mb-3">
                Pemberian Anda dikelompokkan secara ketat pada pemenuhan kebutuhan dasar guru honorer
                serta prasarana belajar pendamping di kelas.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-around mt-auto">
              <div className="h-44 w-44 relative flex-shrink-0">
                {pageLoading ? (
                  <div className="portal-donor-chart-empty portal-donor-chart-empty--compact h-full">
                    Memuat…
                  </div>
                ) : !hasDonationActivity || allocationData.length === 0 ? (
                  <div className="portal-donor-chart-empty portal-donor-chart-empty--compact h-full">
                    <span className="text-[9px] uppercase font-bold text-bea-sage-muted">Total Alokasi</span>
                    <span className="text-sm font-black text-bea-ink font-mono mt-1">Rp 0</span>
                    <span className="text-[10px] text-bea-sage-muted mt-2 text-center px-2">
                      Alokasi muncul setelah donasi tersimpan
                    </span>
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={176}>
                      <PieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {allocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`Rp ${Number(value).toLocaleString('id-ID')}`, '']}
                      contentStyle={{
                        backgroundColor: '#1c1917',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '11px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-[9px] uppercase font-bold text-bea-sage-muted">Total Alokasi</span>
                  <span className="text-xs font-black text-bea-ink font-mono">
                    {formatDonationShort(totalDonationAmount)}
                  </span>
                </div>
                  </>
                )}
              </div>

              <div className="space-y-2.5 flex-1 min-w-0 max-w-xs text-xs">
                {!hasDonationActivity || allocationData.length === 0 ? (
                  <p className="text-[11px] text-bea-sage leading-relaxed">
                    Rincian alokasi donasi (gaji guru asuh, buku pedagogi, kebutuhan kelas) akan
                    tampil otomatis dan sinkron dengan riwayat transaksi Anda.
                  </p>
                ) : (
                  allocationData.map((item, idx) => (
                  <div key={idx} className="portal-inset-panel flex items-center justify-between gap-4 p-2">
                    <div className="flex items-center gap-2 truncate min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-semibold text-bea-ink truncate text-[11px]">{item.name}</span>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-bea-ink shrink-0">
                      Rp {item.value.toLocaleString('id-ID')}
                    </span>
                  </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </div>

        <Card className="border">
          <PortalSectionHead
            icon={Award}
            title="Pencapaian Philanthropy & Lencana Kehormatan Anda"
            description="Selesaikan aksi kedermawanan berikut untuk membuka apresiasi pahlawan literasi dan merawat perkembangan masa depan cerdas anak-anak honorer."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div
              className={`portal-inset-panel flex items-start gap-3 transition-all ${
                totalDonationAmount > 0 ? 'border-emerald-500/25' : ''
              }`}
            >
              <div
                className={`p-2 rounded-lg ${
                  totalDonationAmount > 0
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : 'bg-bea-ivory text-bea-sage-muted'
                }`}
              >
                <CheckCircle2 size={16} className={totalDonationAmount > 0 ? 'animate-pulse' : ''} />
              </div>
              <div>
                <h4 className="font-bold text-bea-ink flex items-center gap-1">
                  Langkah Pertama Mulia
                  {totalDonationAmount > 0 && (
                    <Badge variant="success" className="text-[9px] px-1">
                      BUKA
                    </Badge>
                  )}
                </h4>
                <p className="text-[11px] text-bea-sage leading-normal mt-1">
                  Selesaikan transfer perdana bantuan kesejahteraan bagi salah satu guru honorer.
                </p>
              </div>
            </div>

            <div
              className={`portal-inset-panel flex items-start gap-3 transition-all ${
                recurringDonationCount >= 2 ? 'border-emerald-500/25' : ''
              }`}
            >
              <div
                className={`p-2 rounded-lg ${
                  recurringDonationCount >= 2
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : 'bg-bea-ivory text-bea-sage-muted'
                }`}
              >
                <Calendar size={16} />
              </div>
              <div>
                <h4 className="font-bold text-bea-ink flex items-center gap-1">
                  Penyokong Konsisten
                  {recurringDonationCount >= 2 && (
                    <Badge variant="success" className="text-[9px] px-1">
                      BUKA
                    </Badge>
                  )}
                </h4>
                <p className="text-[11px] text-bea-sage leading-normal mt-1">
                  Gelar kontributor tetap dengan registrasi donasi bulanan di atas 2 periode.
                </p>
              </div>
            </div>

            <div
              className={`portal-inset-panel flex items-start gap-3 transition-all ${
                directSponsorCount >= 1 ? 'border-emerald-500/25' : ''
              }`}
            >
              <div
                className={`p-2 rounded-lg ${
                  directSponsorCount >= 1
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : 'bg-bea-ivory text-bea-sage-muted'
                }`}
              >
                <Heart size={16} />
              </div>
              <div>
                <h4 className="font-bold text-bea-ink flex items-center gap-1">
                  Sponsor Terhubung
                  {directSponsorCount >= 1 && (
                    <Badge variant="success" className="text-[9px] px-1">
                      BUKA
                    </Badge>
                  )}
                </h4>
                <p className="text-[11px] text-bea-sage leading-normal mt-1">
                  Gelar kemanusiaan ketika profil bantuan asuh Anda terintegrasi langsung ke guru pilihan.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
