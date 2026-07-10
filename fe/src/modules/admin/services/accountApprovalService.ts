import { PendingAccountApproval, User } from '@core/types';
import { accountApprovalRepository } from '@core/db/repositories';

export const accountApprovalService = {
  async getPending(): Promise<PendingAccountApproval[]> {
    return accountApprovalRepository.getPending();
  },

  async decide(userId: string, approve: boolean): Promise<User> {
    return accountApprovalRepository.decide(userId, approve);
  },
};
