/** Label & petunjuk sidebar — tab key tetap sinkron dengan tabs.ts / tabRoutes. */
export type PortalNavMeta = {
  label: string;
  hint?: string;
  group?: string;
  mobile?: string;
};

export const PORTAL_NAV_GROUPS: Record<string, string> = {
  ringkasan: 'Ringkasan',
  operasional: 'Operasional',
  insight: 'Insight program',
  publikasi: 'Publikasi & validasi',
};

export const PORTAL_NAV_META: Record<string, PortalNavMeta> = {
  'Gambaran Umum': {
    label: 'Gambaran Umum',
    hint: 'Statistik & antrian',
    group: 'ringkasan',
    mobile: 'Umum',
  },
  'Sekolah & Institusi': {
    label: 'Sekolah',
    hint: 'Data institusi & validator',
    group: 'operasional',
    mobile: 'Sekolah',
  },
  'Buku Ledger Keuangan': {
    label: 'Keuangan',
    hint: 'Ledger & penyaluran',
    group: 'operasional',
    mobile: 'Keuangan',
  },
  'Donatur & Donasi': {
    label: 'Donatur',
    hint: 'Donasi & verifikasi',
    group: 'operasional',
    mobile: 'Donatur',
  },
  'Analitik Program': {
    label: 'Grafik Program',
    hint: 'Tren donasi & transfer',
    group: 'insight',
    mobile: 'Grafik',
  },
  'CMS Landing': {
    label: 'Halaman Depan',
    hint: 'Edit teks & foto publik',
    group: 'publikasi',
    mobile: 'Landing',
  },
  'Validasi Laporan & Kebijakan': {
    label: 'Syarat & Ketentuan',
    hint: 'Kebijakan publik donatur',
    group: 'publikasi',
    mobile: 'S&K',
  },
  'Pengajuan Profil': { label: 'Profil Saya', mobile: 'Profil' },
  'Laporan Kelas Bulanan': { label: 'Laporan Bulanan', mobile: 'Laporan' },
  'Pelatihan Pedagogi': { label: 'Pelatihan', mobile: 'Pelatihan' },
  'Guru Penerima Bantuan': { label: 'Guru Penerima', mobile: 'Guru' },
  'Jejak Philanthropy': { label: 'Dampak Donasi', mobile: 'Dampak' },
  'Laporan Guru Asuh': { label: 'Laporan Guru', mobile: 'Laporan' },
  'Riwayat Spreadsheet': { label: 'Riwayat Donasi', mobile: 'Riwayat' },
  'Penyamaan Berkas': { label: 'Validasi Berkas', mobile: 'Berkas' },
  'Riwayat Validasi Guru': { label: 'Riwayat Guru', mobile: 'Riwayat' },
};

export function navMeta(tabKey: string): PortalNavMeta {
  return PORTAL_NAV_META[tabKey] ?? { label: tabKey, mobile: tabKey.split(' ')[0] };
}

/** Urutan grup per role — hanya admin yang dipisah section. */
export const ADMIN_NAV_GROUP_ORDER = ['ringkasan', 'operasional', 'insight', 'publikasi'] as const;
