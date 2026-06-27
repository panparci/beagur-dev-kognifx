import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import React, { useEffect } from 'react';
import { PORTAL_FOG_EASE } from '@core/routing/portalTransition';

export type PortalFogMode = 'hidden' | 'reveal' | 'cover' | 'uncover';

type PortalFogTransitionProps = {
  mode: PortalFogMode;
  layer?: 'auth' | 'portal' | 'global';
  onComplete?: () => void;
};

type ModeMotion = {
  duration: number;
  initial: { opacity: number; filter: string; scale: number };
  animate: { opacity: number; filter: string; scale: number };
};

const MODE_CONFIG: Record<Exclude<PortalFogMode, 'hidden'>, ModeMotion> = {
  cover: {
    duration: 0.55,
    initial: { opacity: 0, filter: 'blur(0px)', scale: 1.01 },
    animate: { opacity: 1, filter: 'blur(22px)', scale: 1 },
  },
  reveal: {
    duration: 1.2,
    initial: { opacity: 1, filter: 'blur(22px)', scale: 1 },
    animate: { opacity: 0, filter: 'blur(0px)', scale: 1.02 },
  },
  uncover: {
    duration: 0.85,
    initial: { opacity: 1, filter: 'blur(18px)', scale: 1 },
    animate: { opacity: 0, filter: 'blur(0px)', scale: 1.01 },
  },
};

function FogBlobs() {
  return (
    <>
      <motion.span
        className="portal-fog-blob portal-fog-blob--warm"
        aria-hidden
        animate={{ x: [0, 36, -18, 0], y: [0, -28, 22, 0], scale: [1, 1.08, 0.96, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.span
        className="portal-fog-blob portal-fog-blob--cream"
        aria-hidden
        animate={{ x: [0, -42, 24, 0], y: [0, 18, -32, 0], scale: [1, 0.94, 1.06, 1] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
      />
      <motion.span
        className="portal-fog-blob portal-fog-blob--mist"
        aria-hidden
        animate={{ x: [0, 22, -30, 0], y: [0, 36, -14, 0], scale: [1, 1.04, 0.98, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
      />
    </>
  );
}

export function PortalFogTransition({
  mode,
  layer = 'portal',
  onComplete,
}: PortalFogTransitionProps) {
  const reduce = useReducedMotion();
  const visible = mode !== 'hidden';
  const config = mode !== 'hidden' ? MODE_CONFIG[mode] : null;

  useEffect(() => {
    if (reduce && visible) {
      onComplete?.();
    }
  }, [reduce, visible, onComplete]);

  if (reduce) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {visible && config && (
        <motion.div
          key={mode}
          className={`portal-fog-layer portal-fog-layer--${layer}`}
          initial={config.initial}
          animate={config.animate}
          exit={{ opacity: 0 }}
          transition={{ duration: config.duration, ease: PORTAL_FOG_EASE }}
          onAnimationComplete={() => {
            if (mode === 'reveal' || mode === 'uncover') {
              onComplete?.();
            }
          }}
        >
          <FogBlobs />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
