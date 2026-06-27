import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppProviders } from '@/contexts/AppProviders';
import { AppRoutes } from '@core/routing/AppRoutes';
import { AppErrorBoundary } from '@core/ui/AppErrorBoundary';
import { ToastProvider } from '@core/ui/toast/ToastProvider';

const App: React.FC = () => (
  <AppErrorBoundary>
    <ToastProvider>
      <BrowserRouter>
        <AppProviders>
          <AppRoutes />
        </AppProviders>
      </BrowserRouter>
    </ToastProvider>
  </AppErrorBoundary>
);

export default App;
