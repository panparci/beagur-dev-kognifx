import { apiDelete, apiGet, apiPost } from '@core/api/client';

export type BankDirection = 'INCOMING' | 'OUTGOING';
export type MatchStatus = 'UNMATCHED' | 'SUGGESTED' | 'MATCHED' | 'IGNORED';

export type BankStatementUpload = {
  id: string;
  fileName: string;
  direction: BankDirection;
  uploadedByUserId: string;
  totalLines: number;
  matchedCount: number;
  status: 'REVIEW_NEEDED' | 'COMPLETED';
  createdAt: string;
  periodStart?: string | null;
  periodEnd?: string | null;
  balanceAsOf?: string | null;
  latestBalance?: number | null;
};

export type BankTransactionLine = {
  id: string;
  uploadId: string;
  direction: BankDirection;
  transactionDate: string;
  amount: number;
  counterpartyName: string;
  counterpartyAccount: string;
  description: string;
  matchStatus: MatchStatus;
  matchedDonationId?: string | null;
  matchedLedgerId?: string | null;
  suggestedDonationId?: string | null;
  suggestedLedgerId?: string | null;
  suggestedDonorUserId?: string | null;
};

export type BankLineInput = {
  transactionDate: string;
  amount: number;
  counterpartyName: string;
  counterpartyAccount: string;
  description: string;
};

export const reconciliationService = {
  listUploads: () => apiGet<BankStatementUpload[]>('/api/v1/admin/reconciliation/uploads'),
  listLines: (uploadId: string) =>
    apiGet<BankTransactionLine[]>(`/api/v1/admin/reconciliation/uploads/${uploadId}/lines`),
  createUpload: (body: {
    fileName: string;
    direction: BankDirection;
    lines: BankLineInput[];
    periodStart?: string | null;
    periodEnd?: string | null;
    balanceAsOf?: string | null;
    latestBalance?: number | null;
  }) => apiPost<BankStatementUpload>('/api/v1/admin/reconciliation/uploads', body),
  deleteUpload: (uploadId: string) =>
    apiDelete<{ deleted: boolean; id: string }>(`/api/v1/admin/reconciliation/uploads/${uploadId}`),
  confirmLine: (lineId: string, body?: { donationId?: string; ledgerId?: string }) =>
    apiPost<BankTransactionLine>(`/api/v1/admin/reconciliation/lines/${lineId}/confirm`, body ?? {}),
  ignoreLine: (lineId: string) =>
    apiPost<BankTransactionLine>(`/api/v1/admin/reconciliation/lines/${lineId}/ignore`, {}),
  createDonorFromLine: (lineId: string, body: { donorName: string; email: string }) =>
    apiPost<BankTransactionLine>(`/api/v1/admin/reconciliation/lines/${lineId}/create-donor`, body),
  confirmSuggestedDonor: (lineId: string) =>
    apiPost<BankTransactionLine>(`/api/v1/admin/reconciliation/lines/${lineId}/confirm-donor`, {}),
};

/** Parse CSV: date,amount,name,account,description */
export function parseBankCsv(text: string): BankLineInput[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.toLowerCase().startsWith('date') && !line.toLowerCase().startsWith('tanggal'))
    .map((line) => {
      const parts = line.split(',').map((p) => p.trim());
      return {
        transactionDate: parts[0] ?? '',
        amount: Number(parts[1] ?? 0),
        counterpartyName: parts[2] ?? '',
        counterpartyAccount: parts[3] ?? '',
        description: parts[4] ?? '',
      };
    })
    .filter((row) => row.transactionDate && row.amount > 0);
}
