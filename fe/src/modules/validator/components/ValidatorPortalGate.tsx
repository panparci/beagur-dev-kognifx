import React, { useEffect, useState } from 'react';
import { AccountStatus, UserRole } from '@core/types';
import { PortalOnboardingBackdrop } from '@modules/auth/components/PortalOnboardingBackdrop';
import { useRequireUser } from '@modules/auth/hooks/useRequireUser';
import { validatorInstitutionService } from '../services/validatorInstitutionService';
import { ValidatorInstitutionSetupModal } from './ValidatorInstitutionSetupModal';

function GateFallback() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 min-h-[40vh]">
      <div className="w-8 h-8 border-2 border-bea-copper border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-bea-sage-muted">Memuat portal validator…</p>
    </div>
  );
}

type ValidatorPortalGateProps = {
  children: React.ReactNode;
};

export function ValidatorPortalGate({ children }: ValidatorPortalGateProps) {
  const user = useRequireUser();
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  const checkInstitution = async () => {
    const institution = await validatorInstitutionService.getMine();
    setNeedsSetup(!institution);
  };

  useEffect(() => {
    if (user.role !== UserRole.VALIDATOR || user.accountStatus !== AccountStatus.ACTIVE) {
      setNeedsSetup(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        await checkInstitution();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user.id, user.role, user.accountStatus]);

  if (loading) {
    return <GateFallback />;
  }

  if (needsSetup) {
    return (
      <div className="portal-onboarding-screen">
        <div className="portal-onboarding-scene">
          <PortalOnboardingBackdrop />
        </div>
        <ValidatorInstitutionSetupModal
          onComplete={() => {
            setNeedsSetup(false);
          }}
        />
      </div>
    );
  }

  return <>{children}</>;
}
