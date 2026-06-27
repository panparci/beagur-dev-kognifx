import React from 'react';
import AppLayout from './AppLayout';
import { PortalPage } from './portal/PortalPrimitives';
import { AiAssistantWidget } from '../../modules/ai-assistant/components/AiAssistantWidget';

type PortalShellProps = {
  title: string;
  children: React.ReactNode;
  onSearch?: (query: string) => void;
};

/** Shared layout wrapper for all role dashboards. */
export function PortalShell({ title, children, onSearch }: PortalShellProps) {
  return (
    <AppLayout title={title} onSearch={onSearch}>
      <PortalPage>{children}</PortalPage>
      <AiAssistantWidget />
    </AppLayout>
  );
}
