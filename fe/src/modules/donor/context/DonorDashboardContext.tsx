import { createContext, useContext } from 'react';
import { useDonorDashboard, type DonorDashboardViewModel } from '../hooks/useDonorDashboard';

const DonorDashboardContext = createContext<DonorDashboardViewModel | undefined>(undefined);

export function DonorDashboardProvider({ children }: { children: React.ReactNode }) {
  const value = useDonorDashboard();
  return <DonorDashboardContext.Provider value={value}>{children}</DonorDashboardContext.Provider>;
}

export function useDonorDashboardContext(): DonorDashboardViewModel {
  const ctx = useContext(DonorDashboardContext);
  if (!ctx) {
    throw new Error('useDonorDashboardContext must be used within DonorDashboardProvider');
  }
  return ctx;
}
