import Card from '@core/ui/Card';
import Button from '@core/ui/Button';
import { beaAccentList, beaSectionTitle } from '@core/ui/beaTheme';
import { showTab } from '@core/ui/tabPanel';
import { OVERVIEW_TAB } from '@core/constants/tabs';
import { DonationType } from '@core/types';
import { Heart, TrendingUp } from 'lucide-react';
import { usePortalNav } from '@core/routing/usePortalNav';
import TeacherBeneficiaryCard from '../TeacherBeneficiaryCard';
import { useDonorDashboardContext } from '../../context/DonorDashboardContext';

export function DonorOverviewTab() {
  const { activeTab: currentActiveTab } = usePortalNav();
  const {
    progress,
    approvedTeachers,
    selectedTeacherIndex,
    setSelectedTeacherIndex,
    currentTeacher,
    openDonation,
    handleSponsorTeacher,
  } = useDonorDashboardContext();

  return (
    <div className={showTab(currentActiveTab, OVERVIEW_TAB, 'fill')}>
      <div className="md:hidden shrink-0">
        <Button onClick={() => openDonation()} className="w-full" size="lg">
          <Heart size={18} className="fill-current" />
          Donasi Sekarang
        </Button>
      </div>

      <ul className="grid gap-2 sm:grid-cols-3 shrink-0">
        {[
          'Dana masuk rekening guru, tanpa perantara.',
          'Tanpa potongan admin atau biaya manajemen.',
          'Laporan kegiatan guru dapat dipantau donatur.',
        ].map((text) => (
          <li key={text} className={beaAccentList}>
            {text}
          </li>
        ))}
      </ul>

      <Card variant="soft" className="shrink-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
          <div>
            <h2 className={`${beaSectionTitle} text-lg`}>Target Program Bea Guru Indonesia</h2>
            <p className="text-sm text-bea-sage-muted mt-1">350 guru/bulan · tahun ajaran 2026–2027</p>
          </div>
          <span className="px-4 py-1.5 bg-bea-copper/10 text-bea-copper-dark rounded-full font-bold text-sm tabular-nums">
            {progress.percentage}%
          </span>
        </div>

        <div className="progress-modern mt-2" role="progressbar" aria-valuenow={progress.percentage}>
          <span style={{ width: `${progress.percentage}%` }} />
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-sm pt-2">
          <span className="text-bea-copper font-semibold flex items-center gap-1.5">
            <TrendingUp size={15} />
            Rp {progress.raised.toLocaleString('id-ID')} terkumpul
          </span>
          <span className="text-bea-sage-muted text-xs font-medium">
            {progress.currentTeacherCount ?? progress.fundedTeachersCount} /{' '}
            {progress.monthlyTeacherTarget ?? progress.target} guru
          </span>
        </div>
      </Card>

      <div className="portal-donor-overview-split flex-1 min-h-0">
        <Card className="portal-card--fill h-full flex flex-col justify-between">
          <div className="space-y-2">
            <h2 className={`${beaSectionTitle} text-lg`}>Beri Dukungan Finansial</h2>
            <p className="text-xs text-bea-sage leading-relaxed">
              Mulai salurkan kebaikan Anda. 100% donasi terverifikasi disalurkan langsung secara
              transparan demi menaikkan nutrisi dan pemenuhan motivasi harian guru honorer.
            </p>
          </div>
          <div className="space-y-2 pt-3">
            <Button
              onClick={() => openDonation({ type: DonationType.ONE_TIME })}
              className="w-full py-3.5 text-xs uppercase font-bold tracking-wider"
            >
              Donasi Sekali Waktu
            </Button>
            <Button
              onClick={() => openDonation({ type: DonationType.RECURRING })}
              variant="secondary"
              className="w-full py-3.5 text-xs uppercase font-bold tracking-wider"
            >
              Daftar Donatur Rutin (Bulanan)
            </Button>
          </div>
        </Card>

        <Card className="portal-card--fill h-full flex flex-col">
          <div className="flex justify-between items-center gap-2 mb-3 shrink-0">
            <h2 className={beaSectionTitle}>Daftar Guru Terverifikasi</h2>
            {approvedTeachers.length > 1 && (
              <div className="portal-carousel-nav">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedTeacherIndex((prev) =>
                      prev === 0 ? approvedTeachers.length - 1 : prev - 1,
                    )
                  }
                  className="portal-icon-btn"
                  aria-label="Guru sebelumnya"
                >
                  &larr;
                </button>
                <span className="text-xs font-semibold text-bea-sage-muted tabular-nums">
                  {selectedTeacherIndex + 1} / {approvedTeachers.length}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedTeacherIndex((prev) =>
                      prev === approvedTeachers.length - 1 ? 0 : prev + 1,
                    )
                  }
                  className="portal-icon-btn"
                  aria-label="Guru berikutnya"
                >
                  &rarr;
                </button>
              </div>
            )}
          </div>
          <div className="portal-scroll-pane flex-1 min-h-0">
            {currentTeacher ? (
              <TeacherBeneficiaryCard
                profile={currentTeacher.profile}
                institutionName={currentTeacher.institutionName}
                layout="featured"
                onSponsor={handleSponsorTeacher}
              />
            ) : (
              <p className="text-center py-8 text-bea-sage-muted font-medium">
                Belum ada profil guru yang disetujui yayasan saat ini.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
