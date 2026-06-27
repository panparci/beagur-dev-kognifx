import React from 'react';
import { ApplicationStatus } from '../types';

const TEACHER_STEPS = [
  { key: 'submit', label: 'Ajukan profil' },
  { key: 'validate', label: 'Validasi kepala sekolah' },
  { key: 'approve', label: 'Persetujuan yayasan' },
  { key: 'active', label: 'Guru penerima bantuan' },
] as const;

function teacherStepState(status: ApplicationStatus | undefined, index: number): 'done' | 'active' | 'pending' {
  if (!status) return index === 0 ? 'active' : 'pending';
  if (status === ApplicationStatus.REJECTED) return index === 0 ? 'active' : 'pending';

  const activeIndex =
    status === ApplicationStatus.PENDING_VALIDATION
      ? 1
      : status === ApplicationStatus.PENDING_APPROVAL
        ? 2
        : status === ApplicationStatus.APPROVED
          ? 3
          : 0;

  if (index < activeIndex) return 'done';
  if (index === activeIndex) return 'active';
  return 'pending';
}

interface BusinessFlowBarProps {
  variant: 'teacher';
  status?: ApplicationStatus;
  className?: string;
}

const BusinessFlowBar: React.FC<BusinessFlowBarProps> = ({ variant, status, className = '' }) => {
  if (variant !== 'teacher') return null;

  return (
    <div className={`portal-stepper ${className}`.trim()}>
      <p className="portal-stepper-label">Alur pendaftaran guru honorer</p>
      <div className="portal-stepper-track">
        {TEACHER_STEPS.map((step, index) => {
          const state = teacherStepState(status, index);
          return (
            <div key={step.key} className={`portal-step is-${state}`}>
              <div className="portal-step-dot">{index + 1}</div>
              <span className="portal-step-label">{step.label}</span>
            </div>
          );
        })}
      </div>
      {status === ApplicationStatus.REJECTED && (
        <p className="portal-stepper-alert">
          Pengajuan ditolak. Perbarui profil dan ajukan kembali.
        </p>
      )}
    </div>
  );
};

export default BusinessFlowBar;
