/** ponytail: hardcoded TA 2025–26 NTT — ganti ke API/snapshot saat data live lengkap. */
export const KEUANGAN_TA_2025_2026 = {
  pageTitle: 'Keuangan Tahun Ajaran 2025 - 2026',
  programTitle: 'Program Bea Guru Indonesia',
  subtitle:
    'Laporan Donasi Tahun Ajaran Juli 2025 – Juni 2026 · Provinsi Nusa Tenggara Timur',
  footer: 'Program Bea Guru Indonesia · Bersatu Membantu Guru · Provinsi Nusa Tenggara Timur',
  months: [
    { label: 'Jul 25', donatur: 83, donasi: 72_439_799, transfer: 4_000_000 },
    { label: 'Agt', donatur: 45, donasi: 31_659_275, transfer: 4_400_000 },
    { label: 'Sep', donatur: 32, donasi: 39_892_597, transfer: 4_400_000 },
    { label: 'Okt', donatur: 59, donasi: 33_855_110, transfer: 6_600_000 },
    { label: 'Nov', donatur: 42, donasi: 13_475_356, transfer: 7_800_000 },
    { label: 'Des', donatur: 19, donasi: 15_307_780, transfer: 7_800_000 },
    { label: 'Jan 26', donatur: 35, donasi: 19_687_668, transfer: 8_000_000 },
    { label: 'Feb', donatur: 41, donasi: 21_642_336, transfer: 8_600_000 },
    { label: 'Mar', donatur: 29, donasi: 15_553_221, transfer: 8_800_000 },
    { label: 'Apr', donatur: 36, donasi: 18_699_845, transfer: 16_800_000 },
    { label: 'Mei', donatur: 30, donasi: 12_106_337, transfer: 17_000_000 },
    { label: 'Jun', donatur: 33, donasi: 16_774_000, transfer: 25_000_000 },
  ],
  summary: {
    totalDonasi: 311_093_324,
    totalDonatur: 484,
    avgPerMonth: 25_924_444,
    totalTransfer: 119_200_000,
    gap: 191_893_324,
    chart2Note:
      'Sejak April 2026, transfer ke guru mulai melebihi donasi yang diterima bulan tersebut',
    chart3Note:
      'Gap mencerminkan dana yang masih dikelola — deposito aktif + saldo pocket donasi',
  },
} as const;

export type KeuanganMonthRow = (typeof KEUANGAN_TA_2025_2026.months)[number] & {
  cumulativeDonation: number;
  cumulativeTransfer: number;
  gapBand: number;
};

export function buildKeuanganChartRows(): KeuanganMonthRow[] {
  let cumulativeDonation = 0;
  let cumulativeTransfer = 0;
  return KEUANGAN_TA_2025_2026.months.map((month) => {
    cumulativeDonation += month.donasi;
    cumulativeTransfer += month.transfer;
    return {
      ...month,
      cumulativeDonation,
      cumulativeTransfer,
      gapBand: cumulativeDonation - cumulativeTransfer,
    };
  });
}
