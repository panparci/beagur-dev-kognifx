import { createContext, useContext } from 'react';
import { useAdminDashboard, type AdminDashboardViewModel } from '../hooks/useAdminDashboard';

const AdminDashboardContext = createContext<AdminDashboardViewModel | undefined>(undefined);

export function AdminDashboardProvider({ children }: { children: React.ReactNode }) {
  const value = useAdminDashboard();
  return <AdminDashboardContext.Provider value={value}>{children}</AdminDashboardContext.Provider>;
}

export function useAdminDashboardContext(): AdminDashboardViewModel {
  const ctx = useContext(AdminDashboardContext);
  if (!ctx) {
    throw new Error('useAdminDashboardContext must be used within AdminDashboardProvider');
  }
  return ctx;
}
