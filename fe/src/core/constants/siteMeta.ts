import { UserRole } from '@core/types';
import { OVERVIEW_TAB, BENEFICIARY_TEACHERS_TAB, VALIDATOR_HISTORY_TAB } from '@core/constants/tabs';

export const SITE_NAME = 'Bea Guru';
export const SITE_BRAND = 'Bea Guru Indonesia';
export const SITE_ORG = 'Yayasan Bea Guru Indonesia';

export const SITE_TAGLINE =
  'Platform filantropi transparan — donasi langsung ke rekening guru honorer di seluruh Indonesia.';

export const SITE_DESCRIPTION =
  'Bea Guru menghubungkan donatur dengan guru honorer di daerah terpencil. Dana masuk langsung ke rekening guru, tanpa perantara, tanpa potongan admin. Pantau profil guru, laporan mengajar, dan dampak donasi Anda.';

export const SITE_KEYWORDS = [
  'bea guru',
  'donasi guru honorer',
  'bantuan guru Indonesia',
  'filantropi pendidikan',
  'yayasan guru honorer',
  'donasi pendidikan transparan',
  'guru daerah terpencil',
  'portal donatur guru',
].join(', ');

export const OG_IMAGE_PATH = '/brand/bea-guru-logo.png';

/** Short tab labels — sinkron dengan AppLayout NAV_LABELS. */
export const PORTAL_TAB_SHORT: Record<string, string> = {
  [OVERVIEW_TAB]: 'Gambaran Umum',
  'Sekolah & Institusi': 'Sekolah',
  'Buku Ledger Keuangan': 'Keuangan',
  'Validasi Laporan & Kebijakan': 'Laporan & Kebijakan',
  'Pengajuan Profil': 'Profil Guru',
  'Laporan Kelas Bulanan': 'Laporan Bulanan',
  'Pelatihan Pedagogi': 'Pelatihan',
  'Jejak Philanthropy': 'Dampak Donasi',
  [BENEFICIARY_TEACHERS_TAB]: 'Guru Penerima',
  'Laporan Guru Asuh': 'Laporan Guru Asuh',
  'Riwayat Spreadsheet': 'Riwayat Donasi',
  'Penyamaan Berkas': 'Validasi Berkas',
  [VALIDATOR_HISTORY_TAB]: 'Riwayat Validasi',
};

export const PORTAL_ROLE_NAME: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Dasbor Admin Yayasan',
  [UserRole.TEACHER]: 'Portal Guru Honorer',
  [UserRole.DONOR]: 'Portal Donatur',
  [UserRole.VALIDATOR]: 'Portal Kepala Sekolah',
};

export function buildDocumentTitle(page: string, section?: string): string {
  if (section) return `${page} · ${section} | ${SITE_NAME}`;
  return `${page} | ${SITE_NAME}`;
}

export function portalDocumentTitle(role: UserRole, tab: string): string {
  const section = PORTAL_TAB_SHORT[tab] ?? tab;
  const portal = PORTAL_ROLE_NAME[role] ?? 'Portal';
  return buildDocumentTitle(section, portal);
}

export const PAGE_META = {
  landing: {
    title: buildDocumentTitle('Donasi Langsung ke Guru Honorer'),
    description: SITE_DESCRIPTION,
    noIndex: false,
  },
  login: {
    title: buildDocumentTitle('Masuk Portal'),
    description:
      'Masuk ke portal Bea Guru dengan email dan password. Satu akun untuk guru honorer, kepala sekolah, donatur, dan admin yayasan.',
    noIndex: true,
  },
  register: {
    title: buildDocumentTitle('Daftar Akun Baru'),
    description:
      'Buat akun Bea Guru sekali, pilih peran Anda, dan mulai ajukan bantuan, validasi guru, atau berdonasi secara transparan.',
    noIndex: true,
  },
  chooseRole: {
    title: buildDocumentTitle('Pilih Jenis Akun'),
    description: 'Tentukan peran Anda di Bea Guru — guru honorer, kepala sekolah, atau donatur.',
    noIndex: true,
  },
  pendingVerification: {
    title: buildDocumentTitle('Menunggu Verifikasi Akun'),
    description: 'Akun Anda sedang diverifikasi tim yayasan atau kepala sekolah. Notifikasi dikirim ke email terdaftar.',
    noIndex: true,
  },
} as const;
