import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRequireUser } from '@modules/auth/hooks/useRequireUser';
import { uploadService } from '@modules/funding/services/uploadService';
import { Donation, DonationType, DonationVerificationStatus, MonthlyReport, TeacherProfile } from '@core/types';
import { EMPTY_DONATION_DRAFT } from '@core/draft/draftTypes';
import { useDraftState, useUnsavedChangesGuard } from '@core/hooks/useDraftState';
import { useToast } from '@core/ui/toast/ToastProvider';
import { sponsoredTeacherProfileIds, verifiedDonations } from '@core/domain/donations';

export type DonorFeedReport = {
  report: MonthlyReport;
  teacherName: string;
  teacherPhoto: string;
  institutionName: string;
  jobTitle: string;
};

export type PhilLevel = {
  title: string;
  label: string;
  color: string;
};

export type AllocationSlice = {
  name: string;
  value: number;
  color: string;
};

export const DONATION_CHIPS = [100_000, 250_000, 500_000, 1_000_000] as const;
export const MAX_DONATION_AMOUNT = 1_000_000_000;
export const MAX_PROOF_BYTES = 5 * 1024 * 1024;

export function useDonorDashboard() {
  const user = useRequireUser();
  const toast = useToast();

  const [progress, setProgress] = useState({
    target: 350,
    raised: 0,
    percentage: 0,
    donorCount: 0,
    fundedTeachersCount: 0,
    monthlyTeacherTarget: 350,
    currentTeacherCount: 0,
  });

  const [approvedTeachers, setApprovedTeachers] = useState<
    { profile: TeacherProfile; institutionName: string }[]
  >([]);
  const [selectedTeacherIndex, setSelectedTeacherIndex] = useState(0);
  const [history, setHistory] = useState<Donation[]>([]);
  const [targetTeacher, setTargetTeacher] = useState<TeacherProfile | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [feedReports, setFeedReports] = useState<DonorFeedReport[]>([]);
  const [isDonateOpen, setIsDonateOpen] = useState(false);
  const [isSuccessMsg, setIsSuccessMsg] = useState(false);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);
  const [lastSubmittedInvoice, setLastSubmittedInvoice] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  const {
    draft: donationDraft,
    patchDraft: patchDonation,
    commitSuccess: commitDonationSuccess,
    discardDraft: discardDonationDraft,
    isDirty: isDonationDraftDirty,
  } = useDraftState('donation', user.id, EMPTY_DONATION_DRAFT);

  useUnsavedChangesGuard(isDonationDraftDirty && isDonateOpen);

  const verifiedHistory = useMemo(() => verifiedDonations(history), [history]);

  const totalDonationAmount = useMemo(
    () => verifiedHistory.reduce((sum, d) => sum + d.amount, 0),
    [verifiedHistory],
  );

  const pendingDonationCount = useMemo(
    () => history.filter((d) => d.verificationStatus === DonationVerificationStatus.PENDING).length,
    [history],
  );

  const recurringDonationCount = useMemo(
    () => verifiedHistory.filter((d) => d.type === DonationType.RECURRING).length,
    [verifiedHistory],
  );

  const directSponsorCount = useMemo(() => {
    return sponsoredTeacherProfileIds(history).size;
  }, [history]);

  const estimatedStudentsImpacted = useMemo(() => {
    const baseSponsorImpact = Math.max(1, directSponsorCount) * 32;
    return totalDonationAmount > 0 ? baseSponsorImpact : 0;
  }, [directSponsorCount, totalDonationAmount]);

  const hoursSupported = useMemo(
    () => Math.floor(totalDonationAmount / 15_000),
    [totalDonationAmount],
  );

  const philLevel = useMemo((): PhilLevel => {
    if (totalDonationAmount >= 1_000_000) {
      return {
        title: 'Pilar Utama Pendidikan',
        label: 'Platinum Partner',
        color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      };
    }
    if (totalDonationAmount >= 500_000) {
      return {
        title: 'Sahabat Guru Honorer',
        label: 'Gold Partner',
        color: 'text-amber-600 bg-amber-50 border-amber-200',
      };
    }
    if (totalDonationAmount > 0) {
      return {
        title: 'Sobat Cendekia',
        label: 'Silver Partner',
        color: 'text-bea-copper-dark bg-bea-ivory-light border-bea-line',
      };
    }
    return {
      title: 'Sahabat Baru Mulia',
      label: 'Inisiator',
      color: 'text-bea-sage bg-bea-ivory-light border-bea-line',
    };
  }, [totalDonationAmount]);

  const monthlyTrendData = useMemo(() => {
    const monthLabels = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'Mei',
      'Jun',
      'Jul',
      'Agu',
      'Sep',
      'Okt',
      'Nov',
      'Des',
    ];
    const now = new Date();
    const buckets: { month: string; key: string; donation: number }[] = [];

    for (let offset = 5; offset >= 0; offset -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      buckets.push({
        month: monthLabels[date.getMonth()],
        key: `${date.getFullYear()}-${date.getMonth()}`,
        donation: 0,
      });
    }

    verifiedHistory.forEach((donation) => {
      const date = new Date(donation.createdAt);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const bucket = buckets.find((item) => item.key === key);
      if (bucket) {
        bucket.donation += donation.amount;
      }
    });

    let runningTotal = 0;
    return buckets.map((bucket) => {
      runningTotal += bucket.donation;
      return {
        month: bucket.month,
        'Donasi Bulanan': bucket.donation,
        'Akumulasi Saluran': runningTotal,
      };
    });
  }, [verifiedHistory]);

  const hasDonationActivity = totalDonationAmount > 0;

  const allocationData = useMemo((): AllocationSlice[] => {
    let recurringSum = 0;
    let oneTimeSum = 0;
    verifiedHistory.forEach((d) => {
      if (d.type === DonationType.RECURRING) {
        recurringSum += d.amount;
      } else {
        oneTimeSum += d.amount;
      }
    });

    if (recurringSum === 0 && oneTimeSum === 0) {
      return [];
    }

    return [
      { name: 'Subsidi Gaji Guru Asuh', value: recurringSum, color: '#0d9488' },
      { name: 'Buku & Media Pedagogi', value: Math.floor(oneTimeSum * 0.6), color: '#f59e0b' },
      { name: 'Nutrisi & Alat Gambar Kelas', value: Math.floor(oneTimeSum * 0.4), color: '#e11d48' },
    ].filter((item) => item.value > 0);
  }, [verifiedHistory]);

  const loadStatsAndHistory = useCallback(async () => {
    setPageLoading(true);
    try {
      const campaignStat = await fundingService.getCampaignProgress();
      setProgress(campaignStat);
      setApprovedTeachers(await fundingService.getApprovedTeachersForDonors());
      setHistory(await fundingService.getDonationHistory(user.id));
      setFeedReports(await fundingService.getApprovedMonthlyReportsForFeed());
    } finally {
      setPageLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    void loadStatsAndHistory();
  }, [loadStatsAndHistory]);

  useEffect(() => {
    const refresh = () => {
      void loadStatsAndHistory();
    };
    window.addEventListener('focus', refresh);
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [loadStatsAndHistory]);

  const openDonation = (opts?: { teacher?: TeacherProfile | null; type?: DonationType }) => {
    setTargetTeacher(opts?.teacher ?? null);
    patchDonation({
      teacherProfileId: opts?.teacher?.id ?? '',
      type: opts?.type ?? DonationType.ONE_TIME,
    });
    setIsDonateOpen(true);
  };

  const handleProofFileChange = (file: File | null) => {
    if (file && file.size > MAX_PROOF_BYTES) {
      toast.warning('Ukuran bukti transfer maksimal 5MB.');
      return;
    }
    setProofFile(file);
    if (file) {
      patchDonation({ proofUrl: file.name });
    } else {
      patchDonation({ proofUrl: '' });
    }
  };

  const handleCustomDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    const { amount, type, teacherProfileId } = donationDraft;
    const numericAmount = Number(amount);
    if (!amount || numericAmount <= 0) {
      toast.warning('Nominal donasi wajib lebih besar dari Rp 0.');
      return;
    }
    if (numericAmount > MAX_DONATION_AMOUNT) {
      toast.warning('Nominal donasi melebihi batas maksimum per transaksi.');
      return;
    }
    if (!proofFile) {
      toast.warning('Unggah bukti transfer sebelum mengirim donasi.');
      return;
    }

    try {
      const teacherId = targetTeacher?.id ?? (teacherProfileId || undefined);
      setIsUploadingProof(true);
      const proof = await uploadService.uploadDonationProof(proofFile);
      patchDonation({ proofUrl: proof });
      const saved = await fundingService.makeDonation(user.id, numericAmount, type, teacherId, proof);
      setLastSubmittedInvoice(saved.invoiceNumber ?? null);
      setIsSuccessMsg(true);
      await loadStatsAndHistory();

      setTimeout(() => {
        setIsSuccessMsg(false);
        setIsDonateOpen(false);
        commitDonationSuccess();
        discardDonationDraft({ ...EMPTY_DONATION_DRAFT });
        setProofFile(null);
        setTargetTeacher(null);
        setLastSubmittedInvoice(null);
      }, 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('INVALID_STATE') || msg.includes('409') || msg.includes('CONFLICT')) {
        toast.error('Donasi ditolak: periksa nominal, guru tujuan, dan format bukti transfer.');
      } else {
        toast.error('Gagal mencatat donasi. Periksa koneksi dan coba lagi.');
      }
    } finally {
      setIsUploadingProof(false);
    }
  };

  const handleDownloadReport = () => {
    if (history.length === 0) {
      toast.info('Belum ada riwayat transaksi donasi yang bisa diunduh.');
      return;
    }

    const headers = 'ID,Tanggal,Jumlah,Tipe,Status\n';
    const csvContent = history
      .map(
        (d, index) => {
          const status =
            d.verificationStatus === DonationVerificationStatus.VERIFIED
              ? 'TERVERIFIKASI'
              : d.verificationStatus === DonationVerificationStatus.REJECTED
                ? 'DITOLAK'
                : 'MENUNGGU_VERIFIKASI';
          return `${index + 1},${new Date(d.createdAt).toLocaleDateString('id-ID')},${d.amount},"${d.type === DonationType.RECURRING ? 'BULANAN' : 'ONE TIME'}","${status}"`;
        },
      )
      .join('\n');

    const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `laporan_donasi_${user.name.replace(/\s+/g, '_')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleSponsorTeacher = (profile: TeacherProfile) => {
    openDonation({ teacher: profile, type: DonationType.RECURRING });
  };

  const sponsoredTeacherIds = useMemo(
    () => sponsoredTeacherProfileIds(history),
    [history],
  );

  const sponsoredTeachers = useMemo(
    () => approvedTeachers.filter((t) => t.profile.id && sponsoredTeacherIds.has(t.profile.id)),
    [approvedTeachers, sponsoredTeacherIds],
  );

  const sponsoredFeedReports = useMemo(() => {
    const sponsoredUserIds = new Set(sponsoredTeachers.map((t) => t.profile.userId));
    return feedReports.filter((item) => sponsoredUserIds.has(item.report.teacherUserId));
  }, [feedReports, sponsoredTeachers]);

  const latestTestimonialByUserId = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of sponsoredFeedReports) {
      if (!map.has(item.report.teacherUserId)) {
        map.set(item.report.teacherUserId, item.report.description);
      }
    }
    return map;
  }, [sponsoredFeedReports]);

  useEffect(() => {
    setSelectedTeacherIndex((prev) => {
      if (sponsoredTeachers.length === 0) return 0;
      return Math.min(prev, sponsoredTeachers.length - 1);
    });
  }, [sponsoredTeachers.length]);

  const currentSponsoredTeacher = sponsoredTeachers[selectedTeacherIndex];

  return {
    user,
    pageLoading,
    progress,
    approvedTeachers,
    sponsoredTeachers,
    sponsoredFeedReports,
    latestTestimonialByUserId,
    selectedTeacherIndex,
    setSelectedTeacherIndex,
    currentSponsoredTeacher,
    history,
    feedReports,
    targetTeacher,
    isDonateOpen,
    setIsDonateOpen,
    isSuccessMsg,
    lastSubmittedInvoice,
    isCertificateOpen,
    setIsCertificateOpen,
    donationDraft,
    patchDonation,
    isDonationDraftDirty,
    openDonation,
    handleCustomDonation,
    handleProofFileChange,
    proofFile,
    isUploadingProof,
    handleDownloadReport,
    handleSponsorTeacher,
    totalDonationAmount,
    pendingDonationCount,
    recurringDonationCount,
    directSponsorCount,
    estimatedStudentsImpacted,
    hoursSupported,
    philLevel,
    monthlyTrendData,
    allocationData,
    hasDonationActivity,
    reloadDashboard: loadStatsAndHistory,
  };
}

export type DonorDashboardViewModel = ReturnType<typeof useDonorDashboard>;
