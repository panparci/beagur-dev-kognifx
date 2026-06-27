import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { UserRole } from '@core/types';
import { GraduationCap, HeartHandshake, School, Loader2 } from 'lucide-react';
import { chooseOnboardingRole } from '../services/onboardingService';
import { PORTAL_FOG_EASE } from '@core/routing/portalTransition';

type ChooseRoleModalProps = {
  onComplete: () => Promise<void>;
  animateIn?: boolean;
};

type RoleOption = {
  role: UserRole;
  title: string;
  hint: string;
  icon: React.ReactNode;
};

const ROLE_OPTIONS: RoleOption[] = [
  {
    role: UserRole.TEACHER,
    title: 'Guru Honorer',
    hint: 'Kelola profil dan laporan donasi',
    icon: <GraduationCap size={26} strokeWidth={1.75} aria-hidden />,
  },
  {
    role: UserRole.VALIDATOR,
    title: 'Kepala Sekolah',
    hint: 'Verifikasi guru di sekolah Anda',
    icon: <School size={26} strokeWidth={1.75} aria-hidden />,
  },
  {
    role: UserRole.DONOR,
    title: 'Donatur',
    hint: 'Dukung guru honorer pilihan',
    icon: <HeartHandshake size={26} strokeWidth={1.75} aria-hidden />,
  },
];

export function ChooseRoleModal({ onComplete, animateIn = false }: ChooseRoleModalProps) {
  const reduce = useReducedMotion();
  const [loadingRole, setLoadingRole] = useState<UserRole | null>(null);
  const [hoveredRole, setHoveredRole] = useState<UserRole | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePick = async (role: UserRole) => {
    if (loadingRole) return;
    setLoadingRole(role);
    setError(null);
    try {
      await chooseOnboardingRole(role);
      await onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menetapkan jenis akun.');
      setLoadingRole(null);
    }
  };

  const panelInitial = reduce
    ? false
    : animateIn
      ? { opacity: 0, y: 28, filter: 'blur(10px)' }
      : { opacity: 0, y: 16, filter: 'blur(6px)' };

  const panelAnimate = reduce
    ? undefined
    : { opacity: 1, y: 0, filter: 'blur(0px)' };

  const panelTransition = reduce
    ? undefined
    : {
        duration: animateIn ? 0.7 : 0.55,
        delay: animateIn ? 0.35 : 0.12,
        ease: PORTAL_FOG_EASE,
      };

  return (
    <motion.div
      className="choose-role-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="choose-role-title"
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: PORTAL_FOG_EASE }}
    >
      <motion.div
        className="choose-role-panel"
        initial={panelInitial}
        animate={panelAnimate}
        transition={panelTransition}
      >
        <div className="choose-role-panel-inner">
          <h2 id="choose-role-title" className="choose-role-title">
            Pilih Jenis Akun
          </h2>
          <p className="choose-role-lead">
            Pilih peran yang sesuai dengan Anda. Langkah ini hanya sekali dan menentukan dashboard
            serta proses verifikasi akun.
          </p>

          {error && (
            <div role="alert" className="portal-banner portal-banner--error choose-role-error">
              {error}
            </div>
          )}

          <div className="choose-role-grid">
            {ROLE_OPTIONS.map((option, index) => {
              const isLoading = loadingRole === option.role;
              const isDisabled = loadingRole !== null && !isLoading;
              const isSelected = hoveredRole === option.role || isLoading;
              return (
                <motion.button
                  key={option.role}
                  type="button"
                  className={`choose-role-card${isSelected ? ' choose-role-card--selected' : ''}`}
                  disabled={isDisabled}
                  initial={reduce ? false : { opacity: 0, y: 18 }}
                  animate={reduce ? undefined : { opacity: 1, y: 0 }}
                  transition={
                    reduce
                      ? undefined
                      : {
                          duration: 0.5,
                          delay: (animateIn ? 0.48 : 0.2) + index * 0.08,
                          ease: PORTAL_FOG_EASE,
                        }
                  }
                  onMouseEnter={() => setHoveredRole(option.role)}
                  onMouseLeave={() => setHoveredRole(null)}
                  onFocus={() => setHoveredRole(option.role)}
                  onBlur={() => setHoveredRole(null)}
                  onClick={() => void handlePick(option.role)}
                >
                  <span className="choose-role-card-icon">{option.icon}</span>
                  <span className="choose-role-card-title">{option.title}</span>
                  <span className="choose-role-card-hint">{option.hint}</span>
                  {isLoading && (
                    <span className="choose-role-card-loading">
                      <Loader2 size={16} className="animate-spin" aria-hidden />
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
