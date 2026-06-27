import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpenCheck } from 'lucide-react';
import { PortalTutorialOverlay } from '@core/ui/PortalTutorialOverlay';
import { portalPathForTab } from '@core/routing/tabRoutes';
import {
  TEACHER_TUTORIAL_STEPS,
  isTeacherTutorialCompleted,
  markTeacherTutorialCompleted,
  type TeacherTutorialStep,
} from './teacherTutorialSteps';

type TeacherPortalTutorialProps = {
  pageLoading?: boolean;
};

export function TeacherPortalTutorial({ pageLoading = false }: TeacherPortalTutorialProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [autoShown, setAutoShown] = useState(false);

  useEffect(() => {
    if (pageLoading || autoShown) return;
    if (!isTeacherTutorialCompleted()) {
      const timer = window.setTimeout(() => {
        setOpen(true);
        setAutoShown(true);
      }, 900);
      return () => window.clearTimeout(timer);
    }
    setAutoShown(true);
  }, [pageLoading, autoShown]);

  const finish = useCallback(() => {
    markTeacherTutorialCompleted();
    setOpen(false);
  }, []);

  const handleStepChange = useCallback(
    (step: TeacherTutorialStep, _index: number) => {
      if (!step.tab) return;
      navigate(portalPathForTab(step.tab), { replace: false });
    },
    [navigate],
  );

  return (
    <>
      <button
        type="button"
        className="portal-tutorial-trigger"
        onClick={() => setOpen(true)}
        aria-label="Buka panduan penggunaan portal"
      >
        <BookOpenCheck size={15} aria-hidden />
        <span>Panduan</span>
      </button>

      <PortalTutorialOverlay
        steps={TEACHER_TUTORIAL_STEPS}
        open={open}
        onClose={() => setOpen(false)}
        onComplete={finish}
        onStepChange={handleStepChange}
      />
    </>
  );
}
