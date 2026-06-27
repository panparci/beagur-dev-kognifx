import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRequireUser } from '@modules/auth/hooks/useRequireUser';
import { fundingService } from '@modules/funding/services/fundingService';
import { Donation, DonationType, MonthlyReport, TeacherProfile } from '@core/types';
import { EMPTY_DONATION_DRAFT } from '@core/draft/draftTypes';
import { useDraftState, useUnsavedChangesGuard } from '@core/hooks/useDraftState';
import { useToast } from '@core/ui/toast/ToastProvider';

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
  const [feedReports, setFeedReports] = useState<DonorFeedReport[]>([]);
  const [isDonateOpen, setIsDonateOpen] = useState(false);
  const [isSuccessMsg, setIsSuccessMsg] = useState(false);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const {
    draft: donationDraft,
    patchDraft: patchDonation,
    commitSuccess: commitDonationSuccess,
    discardDraft: discardDonationDraft,
    isDirty: isDonationDraftDirty,
  } = useDraftState('donation', user.id, EMPTY_DONATION_DRAFT);

  useUnsavedChangesGuard(isDonationDraftDirty && isDonateOpen);

  const totalDonationAmount = useMemo(
    () => history.reduce((sum, d) => sum + d.amount, 0),
    [history],
  );

  const recurringDonationCount = useMemo(
    () => history.filter((d) => d.type === DonationType.RECURRING).length,
    [history],
  );

  const directSponsorCount = useMemo(() => {
    const teacherIds = history.map((d) => d.teacherProfileId).filter(Boolean);
    return new Set(teacherIds).size;
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

    history.forEach((donation) => {
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
  }, [history]);

  const hasDonationActivity = totalDonationAmount > 0;

  const allocationData = useMemo((): AllocationSlice[] => {
    let recurringSum = 0;
    let oneTimeSum = 0;
    history.forEach((d) => {
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
  }, [history]);

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

  const handleCustomDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    const { amount, type, teacherProfileId } = donationDraft;
    if (!amount || Number(amount) <= 0) {
      toast.warning('Nominal donasi wajib lebih besar dari Rp 0.');
      return;
    }

    try {
      const teacherId = targetTeacher?.id ?? (teacherProfileId || undefined);
      await fundingService.makeDonation(user.id, Number(amount), type, teacherId);
      setIsSuccessMsg(true);
      await loadStatsAndHistory();

      setTimeout(() => {
        setIsSuccessMsg(false);
        setIsDonateOpen(false);
        commitDonationSuccess();
        discardDonationDraft({ ...EMPTY_DONATION_DRAFT });
        setTargetTeacher(null);
      }, 3000);
    } catch {
      toast.error('Koneksi terganggu. Coba lagi.');
    }
  };

  const handleDownloadReport = () => {
    if (history.length === 0) {
      toast.info('Belum ada riwayat transaksi donasi yang bisa diunduh.');
      return;
    }

    const headers = 'ID,Tanggal,Jumlah,Tipe,Sertifikasi\n';
    const csvContent = history
      .map(
        (d, index) =>
          `${index + 1},${new Date(d.createdAt).toLocaleDateString('id-ID')},${d.amount},"${d.type === DonationType.RECURRING ? 'BULANAN' : 'ONE TIME'}","TERVERIFIKASI"`,
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

  const currentTeacher = approvedTeachers[selectedTeacherIndex];

  return {
    user,
    pageLoading,
    progress,
    approvedTeachers,
    selectedTeacherIndex,
    setSelectedTeacherIndex,
    currentTeacher,
    history,
    feedReports,
    targetTeacher,
    isDonateOpen,
    setIsDonateOpen,
    isSuccessMsg,
    isCertificateOpen,
    setIsCertificateOpen,
    donationDraft,
    patchDonation,
    isDonationDraftDirty,
    openDonation,
    handleCustomDonation,
    handleDownloadReport,
    handleSponsorTeacher,
    totalDonationAmount,
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
