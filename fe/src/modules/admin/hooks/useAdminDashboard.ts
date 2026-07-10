import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRequireUser } from '@modules/auth/hooks/useRequireUser';
import { DEFAULT_ADMIN_TERMS } from '@core/draft/draftTypes';
import { useDraftState, useUnsavedChangesGuard } from '@core/hooks/useDraftState';
import { Institution, TeacherProfile, User, Donation, DonorSummary, DonationType, ApplicationStatus, PendingAccountApproval } from '@core/types';
import { useToast } from '@core/ui/toast/ToastProvider';
import { fundingService } from '@modules/funding/services/fundingService';
import { institutionService } from '@modules/institutions/services/institutionService';
import { settingsService } from '@modules/settings/services/settingsService';
import { teacherService } from '@modules/teachers/services/teacherService';
import { donorService } from '@modules/donors/services/donorService';
import { auditService } from '@modules/admin/services/auditService';
import { accountApprovalService } from '@modules/admin/services/accountApprovalService';
import { AdminAuditLog } from '@core/types';
import { DEFAULT_LANDING_CONTENT, LandingContent } from '@core/constants/landingContent';

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

export type AdminSortKey = 'fullName' | 'jobTitle' | 'status' | 'institutionName';

export function useAdminDashboard() {
  const user = useRequireUser();
  const toast = useToast();

  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [validators, setValidators] = useState<User[]>([]);
  const [pendingValidatorApprovals, setPendingValidatorApprovals] = useState<PendingAccountApproval[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<AdminApprovalItem[]>([]);
  const [allProfiles, setAllProfiles] = useState<TeacherProfile[]>([]);
  const [stats, setStats] = useState({
    raised: 0,
    donorCount: 0,
    fundedTeachersCount: 0,
    pendingSubmissionsCount: 0,
    pendingDonationsCount: 0,
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
  const [donors, setDonors] = useState<DonorSummary[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isDonorModalOpen, setIsDonorModalOpen] = useState(false);
  const [editingDonor, setEditingDonor] = useState<DonorSummary | null>(null);
  const [reviewDonation, setReviewDonation] = useState<Donation | null>(null);
  const [invoiceDonorId, setInvoiceDonorId] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [isDisburseOpen, setIsDisburseOpen] = useState(false);
  const [disburseTeacherId, setDisburseTeacherId] = useState('');
  const [disburseAmount, setDisburseAmount] = useState('');
  const [disburseDescription, setDisburseDescription] = useState('');
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);

  const {
    draft: termsDraft,
    patchDraft: patchTerms,
    resetFromServer: resetTermsFromServer,
    commitSuccess: commitTermsSuccess,
    isDirty: isTermsDirty,
  } = useDraftState('admin-terms', user.id, { text: DEFAULT_ADMIN_TERMS });

  const {
    draft: landingDraft,
    patchDraft: patchLanding,
    resetFromServer: resetLandingFromServer,
    commitSuccess: commitLandingSuccess,
    isDirty: isLandingDirty,
  } = useDraftState('admin-landing', user.id, DEFAULT_LANDING_CONTENT);

  useUnsavedChangesGuard(isTermsDirty || isLandingDirty);

  const loadAllAdminData = async () => {
    const instList = await institutionService.getAllInstitutions();
    setInstitutions(instList);

    const valList = await institutionService.getValidators();
    setValidators(valList);

    const pendingAccounts = await accountApprovalService.getPending();
    setPendingValidatorApprovals(pendingAccounts);

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
      pendingDonationsCount: campaignStats.pendingDonationsCount ?? 0,
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

    try {
      const savedLanding = await settingsService.getLandingContent();
      resetLandingFromServer(savedLanding);
    } catch {
      /* keep default */
    }

    const reportsList = await teacherService.getAllReportsWithDetails();
    setReportsWithDetails(reportsList);

    const donorList = await donorService.getAllDonors();
    setDonors(donorList);

    const donationList = await fundingService.getAllTransactions();
    setDonations(donationList);

    const logs = await auditService.getRecentLogs();
    setAuditLogs(logs);
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

  const handleValidatorAccountDecision = async (userId: string, approve: boolean) => {
    try {
      await accountApprovalService.decide(userId, approve);
      toast.success(
        `Akun kepala sekolah ${approve ? 'disetujui' : 'ditolak'}.`,
        'Persetujuan akun',
      );
      await loadAllAdminData();
    } catch {
      toast.error('Gagal memproses persetujuan akun kepala sekolah.');
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

  const handleSaveLanding = async () => {
    try {
      const saved = await settingsService.saveLandingContent(landingDraft);
      commitLandingSuccess();
      resetLandingFromServer(saved, { force: true });
      toast.success('Konten landing page berhasil dipublikasi.', 'CMS tersimpan');
    } catch {
      toast.error('Gagal menyimpan konten landing page.');
    }
  };

  const institutionNameById = useMemo(
    () =>
      institutions.reduce(
        (acc, inst) => {
          acc[inst.id] = inst.name;
          return acc;
        },
        {} as Record<string, string>,
      ),
    [institutions],
  );

  const teacherInstitutionName = useCallback(
    (profile: TeacherProfile) =>
      institutionNameById[profile.institutionId] || profile.institutionName || 'Sekolah',
    [institutionNameById],
  );

  const handleExportFinancials = () => {
    if (transactions.length === 0) {
      toast.info('Belum ada transaksi ledger untuk diekspor.');
      return;
    }
    const rows = transactions
      .map(
        (trx) =>
          `<tr><td>${trx.date}</td><td>${trx.description}</td><td style="color:${trx.type === 'IN' ? '#059669' : '#e11d48'}">${trx.type === 'IN' ? '+' : '-'} Rp ${trx.amount.toLocaleString('id-ID')}</td></tr>`,
      )
      .join('');
    const html = `<!DOCTYPE html><html><head><title>Buku Audit Bea Guru</title><style>body{font-family:sans-serif;padding:24px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f5f5}</style></head><body><h1>Buku Besar Kas Bea Guru</h1><p>Dicetak: ${new Date().toLocaleString('id-ID')}</p><table><thead><tr><th>Tanggal</th><th>Uraian</th><th>Jumlah</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
    const win = window.open('', '_blank');
    if (!win) {
      toast.error('Popup diblokir browser. Izinkan popup untuk ekspor PDF.');
      return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
    toast.success('Gunakan "Simpan sebagai PDF" di dialog cetak.', 'Ekspor audit');
  };

  const handleOpenAddDonor = () => {
    setEditingDonor(null);
    setIsDonorModalOpen(true);
  };

  const handleOpenEditDonor = (donor: DonorSummary) => {
    setEditingDonor(donor);
    setIsDonorModalOpen(true);
  };

  const handleCloseDonorModal = () => {
    setIsDonorModalOpen(false);
    setEditingDonor(null);
  };

  const handleSaveDonor = async (donor: { id?: string; email: string; name: string; phone: string }) => {
    try {
      await donorService.saveDonor(donor);
      toast.success('Data donatur berhasil disimpan.', 'Donatur tersimpan');
      handleCloseDonorModal();
      await loadAllAdminData();
    } catch {
      toast.error('Gagal menyimpan data donatur.');
      throw new Error('save donor failed');
    }
  };

  const handleVerifyDonation = async (donationId: string, approve: boolean, invoiceNo?: string) => {
    try {
      await fundingService.verifyDonation(donationId, approve, invoiceNo);
      toast.success(`Donasi ${approve ? 'diverifikasi' : 'ditolak'}.`, 'Verifikasi donasi');
      setReviewDonation(null);
      await loadAllAdminData();
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('INVALID_STATE') || message.includes('409')) {
        toast.warning('Donasi ini sudah diproses sebelumnya.');
        setReviewDonation(null);
        await loadAllAdminData();
        return;
      }
      toast.error('Gagal memverifikasi donasi.');
    }
  };

  const handleCreateInvoice = async () => {
    if (!invoiceDonorId || !invoiceAmount || Number(invoiceAmount) <= 0) {
      toast.warning('Pilih donatur dan isi nominal tagihan.');
      return;
    }
    try {
      await fundingService.createDonationInvoice({
        donorUserId: invoiceDonorId,
        amount: Number(invoiceAmount),
        type: DonationType.ONE_TIME,
        invoiceNumber: invoiceNumber.trim() || undefined,
      });
      toast.success('Tagihan donasi dibuat.', 'Invoice');
      setInvoiceDonorId('');
      setInvoiceAmount('');
      setInvoiceNumber('');
      await loadAllAdminData();
    } catch {
      toast.error('Gagal membuat tagihan.');
    }
  };

  const handleDisburse = async () => {
    if (!disburseTeacherId || !disburseAmount || Number(disburseAmount) <= 0) {
      toast.warning('Pilih guru dan isi nominal penyaluran.');
      return;
    }
    try {
      await fundingService.disburseToTeacher(
        disburseTeacherId,
        Number(disburseAmount),
        disburseDescription.trim() || undefined,
      );
      toast.success('Penyaluran dana berhasil dicatat.', 'Penyaluran');
      setIsDisburseOpen(false);
      setDisburseTeacherId('');
      setDisburseAmount('');
      setDisburseDescription('');
      await loadAllAdminData();
    } catch {
      toast.error('Gagal mencatat penyaluran.');
    }
  };

  const handleDeactivateDonor = async (donor: DonorSummary) => {
    if (!window.confirm(`Nonaktifkan donatur ${donor.name}? Riwayat donasi tetap tersimpan.`)) {
      return;
    }
    try {
      await donorService.deactivateDonor(donor.id);
      toast.success('Donatur dinonaktifkan.', 'Donatur nonaktif');
      await loadAllAdminData();
    } catch {
      toast.error('Gagal menonaktifkan donatur.');
    }
  };

  const approvedTeachers = useMemo(
    () => allProfiles.filter((p) => p.status === ApplicationStatus.APPROVED && p.id),
    [allProfiles],
  );

  const toggleSortDirection = () => {
    setSortConfig((prev) => ({ ...prev, direction: prev.direction === 'asc' ? 'desc' : 'asc' }));
  };

  const filteredInstitutions = institutions.filter(
    (inst) =>
      inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.address.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredTeachers = allProfiles.filter((p) => {
    const school = teacherInstitutionName(p).toLowerCase();
    const q = searchQuery.toLowerCase();
    return (
      p.fullName.toLowerCase().includes(q) ||
      p.jobTitle.toLowerCase().includes(q) ||
      school.includes(q)
    );
  });

  const sortedTeachers = useMemo(() => {
    return [...filteredTeachers].sort((a, b) => {
      const key = sortConfig.key;
      const aVal =
        key === 'institutionName' ? teacherInstitutionName(a) : String(a[key] || '');
      const bVal =
        key === 'institutionName' ? teacherInstitutionName(b) : String(b[key] || '');
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredTeachers, sortConfig, teacherInstitutionName]);

  return {
    user,
    institutions,
    validators,
    pendingValidatorApprovals,
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
    landingDraft,
    patchLanding,
    isLandingDirty,
    handleSaveLanding,
    validatorMap,
    sortedTeachers,
    filteredInstitutions,
    handleReportDecision,
    handleOpenAddModal,
    handleOpenEditModal,
    handleCloseModal,
    handleSaveInstitution,
    handleAdminDecision,
    handleValidatorAccountDecision,
    handleSaveTerms,
    handleExportFinancials,
    toggleSortDirection,
    donors,
    donations,
    isDonorModalOpen,
    editingDonor,
    reviewDonation,
    setReviewDonation,
    invoiceDonorId,
    setInvoiceDonorId,
    invoiceAmount,
    setInvoiceAmount,
    invoiceNumber,
    setInvoiceNumber,
    isDisburseOpen,
    setIsDisburseOpen,
    disburseTeacherId,
    setDisburseTeacherId,
    disburseAmount,
    setDisburseAmount,
    disburseDescription,
    setDisburseDescription,
    allProfiles,
    approvedTeachers,
    handleOpenAddDonor,
    handleOpenEditDonor,
    handleCloseDonorModal,
    handleSaveDonor,
    handleVerifyDonation,
    handleCreateInvoice,
    handleDisburse,
    auditLogs,
    handleDeactivateDonor,
  };
}

export type AdminDashboardViewModel = ReturnType<typeof useAdminDashboard>;
