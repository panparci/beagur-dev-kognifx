import { UserRole } from '../types';
import {
  OVERVIEW_TAB,
  BENEFICIARY_TEACHERS_TAB,
  VALIDATOR_HISTORY_TAB,
} from '../constants/tabs';

/** All dashboard tab labels — keep in sync with AppLayout nav links. */
export const ALL_PORTAL_TABS = [
  OVERVIEW_TAB,
  'Sekolah & Institusi',
  'Buku Ledger Keuangan',
  'Validasi Laporan & Kebijakan',
  'Pengajuan Profil',
  'Laporan Kelas Bulanan',
  'Pelatihan Pedagogi',
  BENEFICIARY_TEACHERS_TAB,
  'Jejak Philanthropy',
  'Laporan Guru Asuh',
  'Riwayat Spreadsheet',
  'Penyamaan Berkas',
  VALIDATOR_HISTORY_TAB,
] as const;

export type PortalTab = (typeof ALL_PORTAL_TABS)[number];

export const PORTAL_BASE_PATH = '/portal';

export function tabToSlug(tab: string): string {
  return tab
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const SLUG_BY_TAB: Record<string, string> = Object.fromEntries(
  ALL_PORTAL_TABS.map((tab) => [tab, tabToSlug(tab)]),
);

export const TAB_BY_SLUG: Record<string, string> = Object.fromEntries(
  ALL_PORTAL_TABS.map((tab) => [tabToSlug(tab), tab]),
);

export const OVERVIEW_TAB_SLUG = SLUG_BY_TAB[OVERVIEW_TAB];

export function portalPathForTab(tab: string): string {
  const slug = SLUG_BY_TAB[tab] ?? tabToSlug(tab);
  return `${PORTAL_BASE_PATH}/${slug}`;
}

export function tabsForRole(role: UserRole | undefined): string[] {
  switch (role) {
    case UserRole.ADMIN:
      return [
        OVERVIEW_TAB,
        'Sekolah & Institusi',
        'Buku Ledger Keuangan',
        'Validasi Laporan & Kebijakan',
      ];
    case UserRole.TEACHER:
      return [
        OVERVIEW_TAB,
        'Pengajuan Profil',
        'Laporan Kelas Bulanan',
        'Pelatihan Pedagogi',
      ];
    case UserRole.DONOR:
      return [
        OVERVIEW_TAB,
        BENEFICIARY_TEACHERS_TAB,
        'Jejak Philanthropy',
        'Laporan Guru Asuh',
        'Riwayat Spreadsheet',
      ];
    case UserRole.VALIDATOR:
      return [OVERVIEW_TAB, 'Penyamaan Berkas', VALIDATOR_HISTORY_TAB];
    default:
      return [OVERVIEW_TAB];
  }
}

export function resolveTabFromSlug(
  slug: string | undefined,
  role: UserRole | undefined,
): string {
  const allowed = tabsForRole(role);
  if (!slug) {
    return allowed[0] ?? OVERVIEW_TAB;
  }
  const tab = TAB_BY_SLUG[slug];
  if (tab && allowed.includes(tab)) {
    return tab;
  }
  return allowed[0] ?? OVERVIEW_TAB;
}

export function isPortalPath(pathname: string): boolean {
  return pathname === PORTAL_BASE_PATH || pathname.startsWith(`${PORTAL_BASE_PATH}/`);
}
