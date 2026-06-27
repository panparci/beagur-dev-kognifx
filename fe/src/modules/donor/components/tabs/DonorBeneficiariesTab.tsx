import Card from '@core/ui/Card';
import { PortalSectionHead } from '@core/ui/portal/PortalPrimitives';
import { showTab } from '@core/ui/tabPanel';
import { BENEFICIARY_TEACHERS_TAB } from '@core/constants/tabs';
import { usePortalNav } from '@core/routing/usePortalNav';
import TeacherBeneficiaryCard from '../TeacherBeneficiaryCard';
import { useDonorDashboardContext } from '../../context/DonorDashboardContext';

export function DonorBeneficiariesTab() {
  const { activeTab: currentActiveTab } = usePortalNav();
  const { approvedTeachers, handleSponsorTeacher } = useDonorDashboardContext();

  return (
    <div className={showTab(currentActiveTab, BENEFICIARY_TEACHERS_TAB, 'fill')}>
      <PortalSectionHead
        title="Guru Penerima Bantuan"
        description={`${approvedTeachers.length} guru terverifikasi yayasan siap menerima dukungan donatur.`}
      />
      {approvedTeachers.length > 0 ? (
        <div className="portal-scroll-pane flex-1 min-h-0">
          <div className="portal-beneficiary-grid">
            {approvedTeachers.map((item) => (
              <TeacherBeneficiaryCard
                key={item.profile.id}
                profile={item.profile}
                institutionName={item.institutionName}
                layout="grid"
                onSponsor={handleSponsorTeacher}
              />
            ))}
          </div>
        </div>
      ) : (
        <Card className="portal-empty-state p-6 text-center text-bea-sage-muted font-medium">
          Belum ada profil guru yang disetujui yayasan saat ini.
        </Card>
      )}
    </div>
  );
}
