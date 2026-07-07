import { AnalyticsSnapshotInput, ProgramAnalytics } from '@core/types';
import { apiGet, apiPost } from '@core/api/client';
import {
  ANALYTICS_IMPORT_TEMPLATE,
  parseAnalyticsCsv,
  parseAnalyticsImportFile,
} from '@core/domain/analyticsImport';

export { ANALYTICS_IMPORT_TEMPLATE, parseAnalyticsCsv };

export const adminAnalyticsService = {
  async getMonthly(months = 12): Promise<ProgramAnalytics> {
    return apiGet<ProgramAnalytics>(`/api/v1/admin/analytics/monthly?months=${months}`);
  },

  async importSnapshots(rows: AnalyticsSnapshotInput[]): Promise<{ imported: number }> {
    return apiPost<{ imported: number }>('/api/v1/admin/analytics/snapshots', { rows });
  },

  parseCsv(text: string): AnalyticsSnapshotInput[] {
    return parseAnalyticsCsv(text);
  },

  async parseImportFile(file: File): Promise<AnalyticsSnapshotInput[]> {
    return parseAnalyticsImportFile(file);
  },
};
