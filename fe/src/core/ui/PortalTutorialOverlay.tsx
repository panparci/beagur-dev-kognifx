import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import Button from '@core/ui/Button';
import { PORTAL_FOG_EASE } from '@core/routing/portalTransition';

export type PortalTutorialStep = {
  id: string;
  kicker?: string;
  title: string;
  body: string;
  tips?: string[];
  icon?: React.ReactNode;
};

type PortalTutorialOverlayProps = {
  steps: PortalTutorialStep[];
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
  /** Dipanggil saat step aktif berganti — mis. untuk navigasi ke tab terkait */
  onStepChange?: (step: PortalTutorialStep, index: number) => void;
};

export function PortalTutorialOverlay({
  steps,
  open,
  onClose,
  onComplete,
  onStepChange,
}: PortalTutorialOverlayProps) {
  const reduce = useReducedMotion();
  const [stepIndex, setStepIndex] = useState(0);

  const step = steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;
  const progress = ((stepIndex + 1) / steps.length) * 100;

  useEffect(() => {
    if (!open) {
      setStepIndex(0);
      return;
    }
    if (step) {
      onStepChange?.(step, stepIndex);
    }
  }, [open, stepIndex, step, onStepChange]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || steps.length === 0) {
    return null;
  }

  const goNext = () => {
    if (isLast) {
      onComplete();
      return;
    }
    setStepIndex((i) => i + 1);
  };

  const goBack = () => {
    if (!isFirst) setStepIndex((i) => i - 1);
  };

  const cardMotion = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 24, scale: 0.97, filter: 'blur(6px)' },
        animate: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
        exit: { opacity: 0, y: -16, scale: 0.98, filter: 'blur(4px)' },
        transition: { duration: 0.42, ease: PORTAL_FOG_EASE },
      };

  return (
    <div className="portal-tutorial-root" role="dialog" aria-modal="true" aria-labelledby="portal-tutorial-title">
      <motion.button
        type="button"
        className="portal-tutorial-backdrop"
        aria-label="Tutup panduan"
        onClick={onClose}
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      />

      <div className="portal-tutorial-stage">
        <motion.div
          className="portal-tutorial-card"
          initial={reduce ? false : { opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: PORTAL_FOG_EASE }}
        >
          <div className="portal-tutorial-card-accent" aria-hidden />

          <header className="portal-tutorial-head">
            <div className="portal-tutorial-head-text">
              <p className="portal-tutorial-kicker">
                Langkah {stepIndex + 1} dari {steps.length}
                {step.kicker ? ` · ${step.kicker}` : ''}
              </p>
              <div className="portal-tutorial-progress" aria-hidden>
                <motion.span
                  className="portal-tutorial-progress-fill"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.35, ease: PORTAL_FOG_EASE }}
                />
              </div>
            </div>
            <button type="button" className="portal-tutorial-close" onClick={onClose} aria-label="Tutup">
              <X size={18} />
            </button>
          </header>

          <AnimatePresence mode="wait">
            <motion.div key={step.id} className="portal-tutorial-body" {...cardMotion}>
              {step.icon ? <div className="portal-tutorial-icon">{step.icon}</div> : null}
              <h2 id="portal-tutorial-title" className="portal-tutorial-title">
                {step.title}
              </h2>
              <p className="portal-tutorial-text">{step.body}</p>
              {step.tips && step.tips.length > 0 ? (
                <ul className="portal-tutorial-tips">
                  {step.tips.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              ) : null}
            </motion.div>
          </AnimatePresence>

          <div className="portal-tutorial-dots" aria-hidden>
            {steps.map((s, i) => (
              <motion.span
                key={s.id}
                className={`portal-tutorial-dot ${i === stepIndex ? 'is-active' : i < stepIndex ? 'is-done' : ''}`}
                animate={i === stepIndex ? { scale: 1.15 } : { scale: 1 }}
                transition={{ duration: 0.2 }}
              />
            ))}
          </div>

          <footer className="portal-tutorial-foot">
            <button type="button" className="portal-tutorial-skip" onClick={onComplete}>
              Lewati panduan
            </button>
            <div className="portal-tutorial-actions">
              {!isFirst ? (
                <Button variant="outline" size="sm" onClick={goBack}>
                  <ChevronLeft size={16} aria-hidden />
                  Kembali
                </Button>
              ) : null}
              <Button variant="primary" size="sm" onClick={goNext}>
                {isLast ? 'Selesai' : 'Lanjut'}
                {!isLast ? <ChevronRight size={16} aria-hidden /> : null}
              </Button>
            </div>
          </footer>
        </motion.div>
      </div>
    </div>
  );
}
