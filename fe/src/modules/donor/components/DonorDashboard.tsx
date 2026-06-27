import { Suspense, lazy } from 'react';
import { PortalShell } from '@core/ui/PortalShell';
import { TabFallback } from '@core/ui/TabFallback';
import { DonorDashboardProvider, useDonorDashboardContext } from '../context/DonorDashboardContext';
import { DonationModal } from './DonationModal';
import { CertificateModal } from './CertificateModal';
import { DonorOverviewTab } from './tabs/DonorOverviewTab';
import { DonorBeneficiariesTab } from './tabs/DonorBeneficiariesTab';
import { DonorReportsTab } from './tabs/DonorReportsTab';
import { DonorHistoryTab } from './tabs/DonorHistoryTab';

const DonorImpactTab = lazy(() =>
  import('./tabs/DonorImpactTab').then((m) => ({ default: m.DonorImpactTab })),
);

function DonorDashboardContent() {
  const { pageLoading } = useDonorDashboardContext();

  return (
    <PortalShell title="Portal Donatur">
      {pageLoading && (
        <div className="portal-banner portal-banner--loading" role="status">
          Memuat data kampanye…
        </div>
      )}

      <DonationModal />
      <CertificateModal />
      <DonorOverviewTab />
      <DonorBeneficiariesTab />
      <DonorReportsTab />
      <Suspense fallback={<TabFallback label="Memuat analitik dampak…" />}>
        <DonorImpactTab />
      </Suspense>
      <DonorHistoryTab />
    </PortalShell>
  );
}

const DonorDashboard = () => (
  <DonorDashboardProvider>
    <DonorDashboardContent />
  </DonorDashboardProvider>
);

export default DonorDashboard;
