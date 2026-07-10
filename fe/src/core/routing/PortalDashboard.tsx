import React, { Suspense, lazy } from 'react';
import { UserRole } from '@core/types';
import { ValidatorPortalGate } from '@modules/validator/components/ValidatorPortalGate';

const AdminDashboard = lazy(() => import('@modules/admin/components/AdminDashboard'));
const TeacherDashboard = lazy(() => import('@modules/teacher/components/TeacherDashboard'));
const DonorDashboard = lazy(() => import('@modules/donor/components/DonorDashboard'));
const ValidatorDashboard = lazy(() => import('@modules/validator/components/ValidatorDashboard'));

function DashboardFallback() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 min-h-[40vh]">
      <div className="w-8 h-8 border-2 border-bea-copper border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-bea-sage-muted">Memuat dashboard…</p>
    </div>
  );
}

const PortalDashboard: React.FC<{ role: UserRole }> = ({ role }) => {
  let Dashboard: React.LazyExoticComponent<React.ComponentType>;

  switch (role) {
    case UserRole.ADMIN:
      Dashboard = AdminDashboard;
      break;
    case UserRole.TEACHER:
      Dashboard = TeacherDashboard;
      break;
    case UserRole.DONOR:
      Dashboard = DonorDashboard;
      break;
    case UserRole.VALIDATOR:
      Dashboard = ValidatorDashboard;
      break;
    default:
      return null;
  }

  if (role === UserRole.VALIDATOR) {
    return (
      <ValidatorPortalGate>
        <Suspense fallback={<DashboardFallback />}>
          <Dashboard />
        </Suspense>
      </ValidatorPortalGate>
    );
  }

  return (
    <Suspense fallback={<DashboardFallback />}>
      <Dashboard />
    </Suspense>
  );
};

export default PortalDashboard;
