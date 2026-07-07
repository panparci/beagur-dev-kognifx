import { AdminAuditLog } from '@core/types';
import { auditRepository } from '@core/db/repositories';

export const auditService = {
  async getRecentLogs(): Promise<AdminAuditLog[]> {
    return auditRepository.getRecent();
  },
};
