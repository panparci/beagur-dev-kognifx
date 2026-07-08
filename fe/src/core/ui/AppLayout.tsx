import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@modules/auth/hooks/useAuth';
import { useToast } from '@core/ui/toast/ToastProvider';
import { usePortalNav } from '@core/routing/usePortalNav';
import { useRequireUser } from '@modules/auth/hooks/useRequireUser';
import PortalLogo from './PortalLogo';
import { UserRole } from '../types';
import { OVERVIEW_TAB, BENEFICIARY_TEACHERS_TAB, VALIDATOR_HISTORY_TAB, ADMIN_ANALYTICS_TAB, ADMIN_LANDING_CMS_TAB } from '../constants/tabs';
import { portalPathForTab } from '../routing/tabRoutes';
import { portalDocumentTitle, SITE_ORG } from '../constants/siteMeta';
import { usePageMeta } from '../hooks/usePageMeta';
import {
  LogOut,
  User as UserIcon,
  LayoutDashboard,
  Building,
  Banknote,
  FileText,
  GraduationCap,
  Heart,
  Search,
  BookOpen,
  TrendingUp,
  BarChart3,
  HandCoins,
  Globe,
  ShieldCheck,
  Users,
} from 'lucide-react';
import {
  ADMIN_NAV_GROUP_ORDER,
  navMeta,
  PORTAL_NAV_GROUPS,
} from '../routing/portalNavMeta';

const LOGOUT_LOADING_MIN_MS = 900;

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
  onSearch?: (query: string) => void;
}

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Admin',
  [UserRole.DONOR]: 'Donatur',
  [UserRole.TEACHER]: 'Guru',
  [UserRole.VALIDATOR]: 'Validator',
};

type NavLinkItem = {
  name: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  to: string;
};

const getShortName = (name: string) => navMeta(name).mobile ?? navMeta(name).label;

function groupNavLinks(links: NavLinkItem[], role: UserRole | undefined) {
  if (role !== UserRole.ADMIN) return [{ group: null as string | null, links }];

  const buckets = new Map<string | null, NavLinkItem[]>();
  for (const link of links) {
    const group = navMeta(link.name).group ?? null;
    if (!buckets.has(group)) buckets.set(group, []);
    buckets.get(group)!.push(link);
  }

  const ordered: { group: string | null; links: NavLinkItem[] }[] = [];
  for (const g of ADMIN_NAV_GROUP_ORDER) {
    const items = buckets.get(g);
    if (items?.length) ordered.push({ group: g, links: items });
  }
  const rest = buckets.get(null);
  if (rest?.length) ordered.push({ group: null, links: rest });
  return ordered;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, title, onSearch }) => {
  const user = useRequireUser();
  const { logout } = useAuth();
  const toast = useToast();
  const { activeTab: currentActiveTab } = usePortalNav();

  const activeMeta = navMeta(currentActiveTab);

  usePageMeta({
    title: user?.role
      ? portalDocumentTitle(user.role, currentActiveTab)
      : title,
    description: `${activeMeta.label} — ${title}. Portal resmi ${SITE_ORG}.`,
    noIndex: true,
  });

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    if (isProfileOpen) {
      document.addEventListener('click', handleClickOutside, true);
    }
    return () => document.removeEventListener('click', handleClickOutside, true);
  }, [isProfileOpen]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setIsProfileOpen(false);
    try {
      await wait(LOGOUT_LOADING_MIN_MS);
      await logout();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Sesi belum berhasil dihapus. Coba lagi.',
        'Logout gagal',
      );
      setIsLoggingOut(false);
    }
  };

  const getNavLinks = (role: UserRole | undefined) => {
    const commonLinks = [{ name: OVERVIEW_TAB, icon: LayoutDashboard, to: portalPathForTab(OVERVIEW_TAB) }];

    switch (role) {
      case UserRole.ADMIN:
        return [
          ...commonLinks,
          { name: 'Sekolah & Institusi', icon: Building, to: portalPathForTab('Sekolah & Institusi') },
          { name: 'Buku Ledger Keuangan', icon: Banknote, to: portalPathForTab('Buku Ledger Keuangan') },
          { name: 'Donatur & Donasi', icon: HandCoins, to: portalPathForTab('Donatur & Donasi') },
          { name: ADMIN_ANALYTICS_TAB, icon: BarChart3, to: portalPathForTab(ADMIN_ANALYTICS_TAB) },
          { name: ADMIN_LANDING_CMS_TAB, icon: Globe, to: portalPathForTab(ADMIN_LANDING_CMS_TAB) },
          { name: 'Validasi Laporan & Kebijakan', icon: ShieldCheck, to: portalPathForTab('Validasi Laporan & Kebijakan') },
        ];
      case UserRole.TEACHER:
        return [
          ...commonLinks,
          { name: 'Pengajuan Profil', icon: UserIcon, to: portalPathForTab('Pengajuan Profil') },
          { name: 'Laporan Kelas Bulanan', icon: FileText, to: portalPathForTab('Laporan Kelas Bulanan') },
          { name: 'Pelatihan Pedagogi', icon: GraduationCap, to: portalPathForTab('Pelatihan Pedagogi') },
        ];
      case UserRole.DONOR:
        return [
          ...commonLinks,
          { name: BENEFICIARY_TEACHERS_TAB, icon: Heart, to: portalPathForTab(BENEFICIARY_TEACHERS_TAB) },
          { name: 'Jejak Philanthropy', icon: TrendingUp, to: portalPathForTab('Jejak Philanthropy') },
          { name: 'Laporan Guru Asuh', icon: BookOpen, to: portalPathForTab('Laporan Guru Asuh') },
          { name: 'Riwayat Spreadsheet', icon: FileText, to: portalPathForTab('Riwayat Spreadsheet') },
        ];
      case UserRole.VALIDATOR:
        return [
          ...commonLinks,
          { name: 'Penyamaan Berkas', icon: Users, to: portalPathForTab('Penyamaan Berkas') },
          { name: VALIDATOR_HISTORY_TAB, icon: FileText, to: portalPathForTab(VALIDATOR_HISTORY_TAB) },
        ];
      default:
        return commonLinks;
    }
  };

  const navLinks = getNavLinks(user?.role);
  const navSections = groupNavLinks(navLinks, user?.role);

  return (
    <div className="app-shell flex h-screen min-h-screen overflow-hidden font-portal">
      {isLoggingOut ? (
        <div className="portal-logout-overlay" role="status" aria-live="assertive" aria-label="Mengakhiri sesi">
          <div className="portal-logout-loader" aria-hidden />
          <p className="portal-logout-title">Mengakhiri sesi...</p>
          <p className="portal-logout-copy">Mohon tunggu sebentar.</p>
        </div>
      ) : null}

      <aside className="portal-sidebar hidden shrink-0 flex-col md:flex">
        <div className="portal-sidebar-brand">
          <div className="portal-sidebar-logo-wrap">
            <PortalLogo variant="sidebar" />
          </div>
        </div>

        <nav className="portal-sidebar-nav" aria-label="Menu portal">
          {navSections.map((section) => (
            <div key={section.group ?? 'default'} className="portal-nav-section">
              {section.group ? (
                <p className="portal-nav-group-label">{PORTAL_NAV_GROUPS[section.group]}</p>
              ) : null}
              {section.links.map((link) => {
                const isActive = link.name === currentActiveTab;
                const meta = navMeta(link.name);
                return (
                  <Link
                    key={link.name}
                    to={link.to}
                    className={`portal-nav-link ${isActive ? 'portal-nav-link--active' : ''}`}
                    title={meta.hint}
                  >
                    <span className={`portal-nav-icon ${isActive ? 'portal-nav-icon--active' : ''}`}>
                      <link.icon size={17} strokeWidth={isActive ? 2.25 : 2} />
                    </span>
                    <span className="portal-nav-link__text">
                      <span className="portal-nav-link__label">{meta.label}</span>
                      {meta.hint ? (
                        <span className="portal-nav-link__hint">{meta.hint}</span>
                      ) : null}
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {user && (
          <div className="portal-sidebar-user">
            <p className="portal-sidebar-user-label">Masuk sebagai</p>
            <p className="portal-sidebar-user-name">{user.name}</p>
            <span className="portal-role-pill">{user.role ? ROLE_LABELS[user.role] : ''}</span>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="portal-sidebar-logout"
            >
              <LogOut size={15} aria-hidden />
              {isLoggingOut ? 'Keluar…' : 'Keluar'}
            </button>
          </div>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="portal-header-bar shrink-0">
          <div className="portal-header">
            <div className="portal-header-title-wrap min-w-0">
              <div className="md:hidden shrink-0">
                <PortalLogo variant="header" />
              </div>
              <div className="min-w-0">
                <h1 className="portal-header-title">{activeMeta.label}</h1>
                {activeMeta.hint ? (
                  <p className="portal-header-subtitle">{activeMeta.hint}</p>
                ) : null}
              </div>
            </div>

            {onSearch && (
              <div className="portal-header-search">
                <Search size={16} className="portal-header-search-icon" aria-hidden />
                <input
                  type="search"
                  placeholder="Cari guru atau sekolah..."
                  onChange={(e) => onSearch(e.target.value)}
                  className="portal-header-search-input"
                  aria-label="Cari guru atau sekolah"
                />
              </div>
            )}

            <div className="portal-header-actions shrink-0" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="portal-profile-btn"
                aria-label="Menu akun"
                aria-expanded={isProfileOpen}
              >
                <div className="portal-profile-avatar">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
                </div>
                <span className="portal-profile-name hidden sm:inline">{user?.name}</span>
              </button>

              {isProfileOpen && (
                <div className="portal-profile-menu animate-fade-in" role="menu">
                  <div className="portal-profile-menu-head">
                    <p className="portal-profile-menu-name">{user?.name}</p>
                    <p className="portal-profile-menu-role">
                      {user?.role ? ROLE_LABELS[user.role] : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    disabled={isLoggingOut}
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleLogout();
                    }}
                    className="portal-profile-logout"
                  >
                    <LogOut size={16} aria-hidden />
                    {isLoggingOut ? 'Keluar…' : 'Keluar dari portal'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="portal-main portal-canvas flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="portal-main-inner">{children}</div>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 pb-safe md:hidden" aria-label="Navigasi utama">
        <div className="nav-float pointer-events-auto mx-2 mb-2 px-0.5 py-0.5">
          <div className="nav-scroll flex items-stretch overflow-x-auto">
            {navLinks.map((link) => {
              const isActive = link.name === currentActiveTab;
              return (
                <Link
                  key={link.name}
                  to={link.to}
                  className={`portal-mobile-nav-btn flex min-w-[4.25rem] flex-1 flex-col items-center justify-center rounded-xl px-1 py-2 transition-all ${
                    isActive ? 'portal-mobile-nav-btn--active' : ''
                  }`}
                >
                  <link.icon size={19} strokeWidth={isActive ? 2.5 : 2} />
                  <span className={`mt-1 text-center text-[9px] leading-tight ${isActive ? 'font-bold text-white' : 'font-medium'}`}>
                    {getShortName(link.name)}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default AppLayout;
