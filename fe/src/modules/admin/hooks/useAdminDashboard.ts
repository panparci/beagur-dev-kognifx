import { useEffect, useMemo, useState } from 'react';
import { useRequireUser } from '@modules/auth/hooks/useRequireUser';
import { DEFAULT_ADMIN_TERMS } from '@core/draft/draftTypes';
import { useDraftState, useUnsavedChangesGuard } from '@core/hooks/useDraftState';
import { Institution, TeacherProfile, User } from '@core/types';
import { useToast } from '@core/ui/toast/ToastProvider';
import { fundingService } from '@modules/funding/services/fundingService';
import { institutionService } from '@modules/institutions/services/institutionService';
import { settingsService } from '@modules/settings/services/settingsService';
import { teacherService } from '@modules/teachers/services/teacherService';

export type AdminApprovalItem = { profile: TeacherProfile; institutionName: string };

export type AdminLedgerRow = {
  id: string;
  date: string;
  description: string;
  type: string;
  amount: number;
};

export type AdminReportDetail = {
  report: { id?: string; status: string; description: string; photoUrl?: string; submittedAt: string };
  teacherName: string;
  teacherPhoto: string;
  institutionName: string;
  jobTitle: string;
};

export type AdminSortKey = 'fullName' | 'jobTitle' | 'status';

export function useAdminDashboard() {
  const user = useRequireUser();
  const toast = useToast();

  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [validators, setValidators] = useState<User[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<AdminApprovalItem[]>([]);
  const [allProfiles, setAllProfiles] = useState<TeacherProfile[]>([]);
  const [stats, setStats] = useState({
    raised: 0,
    donorCount: 0,
    fundedTeachersCount: 0,
    pendingSubmissionsCount: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInstitution, setEditingInstitution] = useState<Institution | null>(null);
  const [reportsWithDetails, setReportsWithDetails] = useState<AdminReportDetail[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: AdminSortKey; direction: 'asc' | 'desc' }>({
    key: 'fullName',
    direction: 'asc',
  });
  const [activeApprovalReview, setActiveApprovalReview] = useState<AdminApprovalItem | null>(null);
  const [transactions, setTransactions] = useState<AdminLedgerRow[]>([]);

  const {
    draft: termsDraft,
    patchDraft: patchTerms,
    resetFromServer: resetTermsFromServer,
    commitSuccess: commitTermsSuccess,
    isDirty: isTermsDirty,
  } = useDraftState('admin-terms', user.id, { text: DEFAULT_ADMIN_TERMS });

  useUnsavedChangesGuard(isTermsDirty);

  const loadAllAdminData = async () => {
    const instList = await institutionService.getAllInstitutions();
    setInstitutions(instList);

    const valList = await institutionService.getValidators();
    setValidators(valList);

    const approveQueue = await teacherService.getPendingApprovals();
    setPendingApprovals(approveQueue);

    const teachers = await teacherService.getAllProfiles();
    setAllProfiles(teachers);

    const campaignStats = await fundingService.getCampaignProgress();
    setStats({
      raised: campaignStats.raised,
      donorCount: campaignStats.donorCount,
      fundedTeachersCount: campaignStats.fundedTeachersCount,
      pendingSubmissionsCount: approveQueue.length,
    });

    const ledger = await fundingService.getLedger();
    setTransactions(
      ledger.map((entry) => ({
        id: entry.id,
        date: new Date(entry.occurredAt).toLocaleDateString('id-ID'),
        description: entry.description,
        type: entry.type,
        amount: entry.amount,
      })),
    );

    try {
      const savedTerms = await settingsService.getTerms();
      resetTermsFromServer({ text: savedTerms });
    } catch {
      /* keep default */
    }

    const reportsList = await teacherService.getAllReportsWithDetails();
    setReportsWithDetails(reportsList);
  };

  useEffect(() => {
    void loadAllAdminData();
  }, []);

  const handleReportDecision = async (reportId: string, approve: boolean) => {
    try {
      await teacherService.updateReportStatus(reportId, approve ? 'APPROVED' : 'REJECTED');
      toast.success(`Laporan bulanan ${approve ? 'disetujui' : 'ditolak'}.`, 'Status diperbarui');
      await loadAllAdminData();
    } catch {
      toast.error('Gagal menyalurkan keputusan verifikasi laporan.');
    }
  };

  const validatorMap = useMemo(
    () =>
      validators.reduce(
        (acc, v) => {
          acc[v.id] = v.name;
          return acc;
        },
        {} as Record<string, string>,
      ),
    [validators],
  );

  const handleOpenAddModal = () => {
    setEditingInstitution(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (institution: Institution) => {
    setEditingInstitution(institution);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingInstitution(null);
  };

  const handleSaveInstitution = async (institution: Institution) => {
    try {
      await institutionService.saveInstitution(institution);
      toast.success('Data institusi sekolah berhasil disimpan.', 'Institusi tersimpan');
      handleCloseModal();
      await loadAllAdminData();
    } catch {
      toast.error('Terjadi kendala saat menyimpan institusi.');
      throw new Error('save institution failed');
    }
  };

  const handleAdminDecision = async (profileId: string, approve: boolean) => {
    try {
      await teacherService.submitAdminDecision(profileId, approve);
      toast.success(
        `Pengajuan guru ${approve ? 'disetujui untuk pendanaan publik' : 'ditolak'}.`,
        'Keputusan yayasan',
      );
      setActiveApprovalReview(null);
      await loadAllAdminData();
    } catch {
      toast.error('Gagal menyalurkan persetujuan.');
    }
  };

  const handleSaveTerms = async () => {
    try {
      await settingsService.saveTerms(termsDraft.text);
      commitTermsSuccess();
      resetTermsFromServer({ text: termsDraft.text }, { force: true });
      toast.success('Syarat & Ketentuan yayasan berhasil dipublikasi.', 'T&C tersimpan');
    } catch {
      toast.error('Gagal menyimpan syarat & ketentuan ke server.');
    }
  };

  const handleExportFinancials = () => {
    toast.info('Fitur ekspor PDF sedang disiapkan.', 'Ekspor audit');
  };

  const toggleSortDirection = () => {
    setSortConfig((prev) => ({ ...prev, direction: prev.direction === 'asc' ? 'desc' : 'asc' }));
  };

  const filteredInstitutions = institutions.filter(
    (inst) =>
      inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.address.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredTeachers = allProfiles.filter(
    (p) =>
      p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const sortedTeachers = useMemo(() => {
    return [...filteredTeachers].sort((a, b) => {
      const key = sortConfig.key;
      const aVal = String(a[key] || '');
      const bVal = String(b[key] || '');
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredTeachers, sortConfig]);

  return {
    user,
    institutions,
    validators,
    pendingApprovals,
    stats,
    isModalOpen,
    editingInstitution,
    reportsWithDetails,
    searchQuery,
    setSearchQuery,
    sortConfig,
    setSortConfig,
    activeApprovalReview,
    setActiveApprovalReview,
    transactions,
    termsDraft,
    patchTerms,
    isTermsDirty,
    validatorMap,
    sortedTeachers,
    filteredInstitutions,
    handleReportDecision,
    handleOpenAddModal,
    handleOpenEditModal,
    handleCloseModal,
    handleSaveInstitution,
    handleAdminDecision,
    handleSaveTerms,
    handleExportFinancials,
    toggleSortDirection,
  };
}

export type AdminDashboardViewModel = ReturnType<typeof useAdminDashboard>;
