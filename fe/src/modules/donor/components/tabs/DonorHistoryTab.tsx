import Card from '@core/ui/Card';
import Button from '@core/ui/Button';
import Badge from '@core/ui/Badge';
import { PortalSectionHead } from '@core/ui/portal/PortalPrimitives';
import { showTab } from '@core/ui/tabPanel';
import { DonationType } from '@core/types';
import { CheckCircle2, Download } from 'lucide-react';
import { usePortalNav } from '@core/routing/usePortalNav';
import { useDonorDashboardContext } from '../../context/DonorDashboardContext';

export function DonorHistoryTab() {
  const { activeTab: currentActiveTab } = usePortalNav();
  const { history, handleDownloadReport } = useDonorDashboardContext();

  return (
    <div className={showTab(currentActiveTab, 'Riwayat Spreadsheet', 'fill')}>
      <Card className="portal-card--fill border flex flex-col min-h-0">
        <PortalSectionHead
          title="Riwayat Penyaluran Donasi Anda"
          action={
            <Button variant="secondary" onClick={handleDownloadReport} size="sm">
              <Download size={15} className="mr-2" />
              Download Spreadsheet Laporan
            </Button>
          }
        />

        <div className="portal-table-wrap portal-table-wrap--fill mt-2">
          <table className="portal-table">
            <thead>
              <tr>
                <th>Tanggal Transaksi</th>
                <th>Jumlah Disalurkan</th>
                <th>Tipe Donasi</th>
                <th>Status Transparansi</th>
              </tr>
            </thead>
            <tbody>
              {history.length > 0 ? (
                history.map((d, i) => (
                  <tr key={i}>
                    <td className="font-mono text-bea-sage-muted">
                      {new Date(d.createdAt).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="font-bold text-bea-ink">Rp {d.amount.toLocaleString('id-ID')}</td>
                    <td>
                      <Badge variant={d.type === DonationType.RECURRING ? 'success' : 'info'}>
                        {d.type === DonationType.RECURRING ? 'Bulanan' : 'Sekali Waktu'}
                      </Badge>
                    </td>
                    <td className="text-emerald-700 font-semibold uppercase tracking-wide text-[10px]">
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 size={11} className="text-emerald-500" />
                        Tercatat 100% Utuh
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-bea-sage-muted font-medium">
                    Belum ada donasi terdaftar. Salurkan kontribusi pertama Anda di atas!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
