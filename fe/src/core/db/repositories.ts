import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from '../api/client';
import {
  User,
  Institution,
  TeacherProfile,
  Donation,
  DonorSummary,
  DonationType,
  MonthlyReport,
  CampaignProgress,
  ReportWithDetails,
  RagDocument,
  AiMemory,
  AiLogEntry,
  LedgerEntry,
  AdminAuditLog,
} from '../types';

/** Go nil-slice encodes as JSON null — normalize to [] for list endpoints */
function asList<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function normalizeInstitution(raw: Institution & { validatorUserId?: string }): Institution {
  return {
    ...raw,
    validatorUserId: raw.validatorUserId ?? '',
  };
}

export const institutionRepository = {
  async getAll(): Promise<Institution[]> {
    const rows = asList(await apiGet<Institution[]>('/api/v1/institutions'));
    return rows.map(normalizeInstitution);
  },

  async getById(id: string): Promise<Institution | null> {
    const all = await this.getAll();
    return all.find((i) => i.id === id) || null;
  },

  async save(inst: Institution): Promise<Institution> {
    const saved = await apiPost<Institution>('/api/v1/institutions', {
      id: inst.id || undefined,
      name: inst.name,
      address: inst.address,
      validatorUserId: inst.validatorUserId,
    });
    return normalizeInstitution(saved);
  },

  async getValidators(): Promise<User[]> {
    const rows = asList(await apiGet<{ id: string; email: string; name: string; role: string }[]>('/api/v1/validators'));
    return rows.map((r) => ({
      id: r.id,
      email: r.email,
      name: r.name,
      role: r.role as User['role'],
    }));
  },
};

export const donorRepository = {
  async getAll(includeInactive = false): Promise<DonorSummary[]> {
    const query = includeInactive ? '?includeInactive=true' : '';
    return asList(await apiGet<DonorSummary[]>(`/api/v1/donors${query}`));
  },

  async save(donor: { id?: string; email: string; name: string; phone: string }): Promise<DonorSummary> {
    return apiPost<DonorSummary>('/api/v1/donors', donor);
  },

  async deactivate(donorId: string): Promise<void> {
    await apiPatch(`/api/v1/donors/${donorId}/deactivate`, {});
  },
};

export const teacherRepository = {
  async getAll(): Promise<TeacherProfile[]> {
    return asList(await apiGet<TeacherProfile[]>('/api/v1/teachers'));
  },

  async getById(id: string): Promise<TeacherProfile | null> {
    const all = await this.getAll();
    return all.find((p) => p.id === id) || null;
  },

  async getByUserId(_userId: string): Promise<TeacherProfile | null> {
    try {
      return await apiGet<TeacherProfile>('/api/v1/teachers/me');
    } catch {
      return null;
    }
  },

  async save(profile: TeacherProfile): Promise<TeacherProfile> {
    return apiPost<TeacherProfile>('/api/v1/teachers', profile);
  },

  async getPendingValidation(): Promise<TeacherProfile[]> {
    return asList(await apiGet<TeacherProfile[]>('/api/v1/teachers/pending-validation'));
  },

  async getValidationHistory(): Promise<TeacherProfile[]> {
    return asList(await apiGet<TeacherProfile[]>('/api/v1/teachers/validation-history'));
  },

  async getPendingApproval(): Promise<TeacherProfile[]> {
    return asList(await apiGet<TeacherProfile[]>('/api/v1/teachers/pending-approval'));
  },

  async getApproved(): Promise<TeacherProfile[]> {
    return asList(await apiGet<TeacherProfile[]>('/api/v1/teachers/approved'));
  },

  async validate(profileId: string, approve: boolean): Promise<TeacherProfile> {
    return apiPost<TeacherProfile>(`/api/v1/teachers/${profileId}/validate?approve=${approve}`);
  },

  async approve(profileId: string, approve: boolean): Promise<TeacherProfile> {
    return apiPost<TeacherProfile>(`/api/v1/teachers/${profileId}/approve?approve=${approve}`);
  },
};

export const donationRepository = {
  async getAll(): Promise<Donation[]> {
    return asList(await apiGet<Donation[]>('/api/v1/donations'));
  },

  async save(donation: Donation): Promise<Donation> {
    return apiPost<Donation>('/api/v1/donations', {
      amount: donation.amount,
      type: donation.type,
      teacherProfileId: donation.teacherProfileId,
      proofUrl: donation.proofUrl,
    });
  },

  async verify(donationId: string, approve: boolean, invoiceNumber?: string): Promise<Donation> {
    return apiPatch<Donation>(`/api/v1/donations/${donationId}/verification`, {
      approve,
      invoiceNumber: invoiceNumber ?? '',
    });
  },

  async createInvoice(input: {
    donorUserId: string;
    amount: number;
    type: DonationType;
    teacherProfileId?: string;
    invoiceNumber?: string;
  }): Promise<Donation> {
    return apiPost<Donation>('/api/v1/donations/invoice', input);
  },

  async disburse(input: { teacherProfileId: string; amount: number; description?: string }) {
    return apiPost<LedgerEntry>('/api/v1/ledger/disburse', input);
  },

  async getByDonorUserId(_donorUserId: string): Promise<Donation[]> {
    return asList(await apiGet<Donation[]>('/api/v1/donations/mine'));
  },

  async getCampaignProgress(): Promise<CampaignProgress> {
    return apiGet<CampaignProgress>('/api/v1/campaign/progress');
  },

  async getLedger(): Promise<LedgerEntry[]> {
    return asList(await apiGet<LedgerEntry[]>('/api/v1/ledger'));
  },
};

export const reportRepository = {
  async getWithDetails(approvedOnly = false): Promise<ReportWithDetails[]> {
    const query = approvedOnly ? '?approved=true' : '';
    return asList(await apiGet<ReportWithDetails[]>(`/api/v1/reports${query}`));
  },

  async getByTeacherUserId(_teacherUserId: string): Promise<MonthlyReport[]> {
    return asList(await apiGet<MonthlyReport[]>('/api/v1/reports/mine'));
  },

  async save(report: MonthlyReport): Promise<MonthlyReport> {
    return apiPost<MonthlyReport>('/api/v1/reports', {
      photoUrl: report.photoUrl,
      description: report.description,
    });
  },

  async updateStatus(reportId: string, status: 'APPROVED' | 'REJECTED'): Promise<MonthlyReport> {
    return apiPatch<MonthlyReport>(`/api/v1/reports/${reportId}/status`, { status });
  },
};

export const auditRepository = {
  async getRecent(): Promise<AdminAuditLog[]> {
    return asList(await apiGet<AdminAuditLog[]>('/api/v1/admin/audit-logs'));
  },
};

export const settingsRepository = {
  async getTerms(): Promise<string> {
    const data = await apiGet<{ value: string }>('/api/v1/settings/terms');
    return data.value;
  },

  async saveTerms(value: string): Promise<string> {
    const data = await apiPut<{ value: string }>('/api/v1/settings/terms', { value });
    return data.value;
  },

  async getLanding(): Promise<string> {
    const data = await apiGet<{ value: string }>('/api/v1/settings/landing');
    return data.value;
  },

  async saveLanding(value: string): Promise<string> {
    const data = await apiPut<{ value: string }>('/api/v1/settings/landing', { value });
    return data.value;
  },
};

function mapMemory(row: { id: string; userId: string; role: 'user' | 'model'; content: string; timestamp: string }): AiMemory {
  return {
    id: row.id,
    userId: row.userId,
    role: row.role,
    content: row.content,
    timestamp: row.timestamp,
  };
}

function mapLog(row: {
  id: string;
  userId: string;
  username: string;
  model: string;
  action: AiLogEntry['action'];
  tokensUsed: number;
  cost: number;
  timestamp: string;
}): AiLogEntry {
  return {
    id: row.id,
    userId: row.userId,
    username: row.username,
    model: row.model,
    action: row.action,
    tokensUsed: row.tokensUsed,
    cost: row.cost,
    timestamp: row.timestamp,
  };
}

export const ragRepository = {
  async search(query: string, topK: number = 3): Promise<RagDocument[]> {
    const q = encodeURIComponent(query);
    return asList(await apiGet<RagDocument[]>(`/api/v1/public/rag?q=${q}&topK=${topK}`));
  },

  async getAll(): Promise<RagDocument[]> {
    return asList(await apiGet<RagDocument[]>('/api/v1/public/rag/all'));
  },
};

export const aiMemoryRepository = {
  async getMemory(_userId: string): Promise<AiMemory[]> {
    const rows = asList(
      await apiGet<{ id: string; userId: string; role: 'user' | 'model'; content: string; timestamp: string }[]>(
        '/api/v1/ai/memory',
      ),
    );
    return rows.map(mapMemory);
  },

  async appendMemory(entry: Omit<AiMemory, 'id'>): Promise<AiMemory> {
    const saved = await apiPost<{ id: string; userId: string; role: 'user' | 'model'; content: string; timestamp: string }>(
      '/api/v1/ai/memory',
      { role: entry.role, content: entry.content }
    );
    return mapMemory(saved);
  },

  async clearMemory(_userId: string): Promise<void> {
    await apiDelete('/api/v1/ai/memory');
  },
};

export const aiLogRepository = {
  async getAll(): Promise<AiLogEntry[]> {
    const rows = asList(
      await apiGet<{
      id: string;
      userId: string;
      username: string;
      model: string;
      action: AiLogEntry['action'];
      tokensUsed: number;
      cost: number;
      timestamp: string;
    }[]>('/api/v1/ai/logs'),
    );
    return rows.map(mapLog);
  },

  async save(log: Omit<AiLogEntry, 'id'>): Promise<AiLogEntry> {
    const saved = await apiPost<{
      id: string;
      userId: string;
      username: string;
      model: string;
      action: AiLogEntry['action'];
      tokensUsed: number;
      cost: number;
      timestamp: string;
    }>('/api/v1/ai/logs', {
      username: log.username,
      model: log.model,
      action: log.action,
      tokensUsed: log.tokensUsed,
      cost: log.cost,
    });
    return mapLog(saved);
  },

  async getStats(): Promise<{ totalTokens: number; totalCost: number }> {
    const logs = await this.getAll();
    return {
      totalTokens: logs.reduce((sum, l) => sum + l.tokensUsed, 0),
      totalCost: logs.reduce((sum, l) => sum + l.cost, 0),
    };
  },
};
