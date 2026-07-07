import Card from '@core/ui/Card';
import Badge from '@core/ui/Badge';
import { PortalSectionHead } from '@core/ui/portal/PortalPrimitives';
import { showTab } from '@core/ui/tabPanel';
import { BookOpen, Heart } from 'lucide-react';
import { usePortalNav } from '@core/routing/usePortalNav';
import { useDonorDashboardContext } from '../../context/DonorDashboardContext';

export function DonorReportsTab() {
  const { activeTab: currentActiveTab } = usePortalNav();
  const { sponsoredFeedReports } = useDonorDashboardContext();

  return (
    <div className={showTab(currentActiveTab, 'Laporan Guru Asuh', 'fill')}>
      <Card className="portal-card--fill border flex flex-col min-h-0">
        <PortalSectionHead
          icon={BookOpen}
          title="Laporan Perkembangan & Kegiatan Belajar Mengajar"
          description="Transparansi langsung dari kelas. Laporan bulanan kegiatan belajar mengajar yang ditulis oleh guru penerima manfaat Bea Guru asuhan Anda."
        />

        {sponsoredFeedReports.length > 0 ? (
          <div className="portal-scroll-pane portal-timeline flex-1 min-h-0">
            {sponsoredFeedReports.map((item, index) => (
              <div key={index} className="portal-timeline-item animate-fade-in text-sm">
                <span className="portal-timeline-dot">
                  <Heart size={11} className="fill-current" />
                </span>

                <div className="portal-inset-panel space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-bea-line pb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={item.teacherPhoto}
                        alt={item.teacherName}
                        className="w-10 h-10 rounded-full object-cover border border-bea-line shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-bea-ink truncate">{item.teacherName}</h4>
                        <p className="text-[11px] text-bea-sage-muted font-medium truncate">
                          {item.jobTitle} &bull; {item.institutionName}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge variant="success">100% Terverifikasi</Badge>
                      <p className="text-[10px] text-bea-sage-muted font-mono mt-1">
                        Selesai:{' '}
                        {new Date(item.report.submittedAt).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                    <div className="md:col-span-2 whitespace-pre-line leading-relaxed text-bea-sage text-sm">
                      {item.report.description}
                    </div>
                    {item.report.photoUrl && (
                      <div className="md:col-span-1 rounded-lg overflow-hidden border border-bea-line bg-bea-ivory">
                        <span className="block text-bea-sage-muted font-bold uppercase tracking-widest text-[8px] p-2 bg-bea-ivory-light border-b border-bea-line">
                          Dokumentasi Kelas
                        </span>
                        <img
                          src={item.report.photoUrl}
                          alt="Dokumentasi kelas"
                          className="w-full h-40 object-cover object-center"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="portal-empty text-center py-10">
            <BookOpen className="portal-empty-icon mx-auto text-bea-copper-soft" size={40} />
            <p className="portal-empty-title">Belum ada Laporan Publik Terverifikasi</p>
            <p className="portal-empty-desc">
              Donasi ke guru binaan Anda untuk melihat laporan bulanan mereka di sini setelah
              diverifikasi yayasan.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
