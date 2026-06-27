import { motion, useAnimation } from 'motion/react';
import React, { forwardRef, useCallback, useImperativeHandle } from 'react';

export interface EyeOffIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface EyeOffIconProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number;
}

/** Animated eye-off — adapted from https://lucide-animated.com/icons/eye-off */
export const EyeOffIcon = forwardRef<EyeOffIconHandle, EyeOffIconProps>(
  ({ onMouseEnter, onMouseLeave, className = '', size = 20, ...props }, ref) => {
    const controls = useAnimation();

    useImperativeHandle(ref, () => ({
      startAnimation: () => void controls.start('animate'),
      stopAnimation: () => void controls.start('normal'),
    }));

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        void controls.start('animate');
        onMouseEnter?.(e);
      },
      [controls, onMouseEnter],
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        void controls.start('normal');
        onMouseLeave?.(e);
      },
      [controls, onMouseLeave],
    );

    return (
      <div
        className={className}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <svg
          fill="none"
          height={size}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <motion.path
            animate={controls}
            d="M10.733 5.076A10.744 10.744 0 0 1 12 5c7 0 10 7 10 7a13.649 13.649 0 0 1-1.67 2.68"
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            variants={{
              normal: { opacity: 1, pathLength: 1 },
              animate: { opacity: [1, 0.4, 1], pathLength: [1, 0.6, 1] },
            }}
          />
          <motion.path
            animate={controls}
            d="M14.084 14.158a3 3 0 0 1-4.242-4.242"
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            variants={{
              normal: { scale: 1, opacity: 1 },
              animate: { scale: [1, 0.6, 1], opacity: [1, 0.3, 1] },
            }}
          />
          <motion.path
            animate={controls}
            d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-4.62"
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            variants={{
              normal: { scaleY: 1, opacity: 1 },
              animate: { scaleY: [1, 0.15, 1], opacity: [1, 0.35, 1] },
            }}
            style={{ originY: '50%' }}
          />
          <motion.path
            animate={controls}
            d="M2 2l20 20"
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            variants={{
              normal: { pathLength: 1, opacity: 1 },
              animate: { pathLength: [0.6, 1, 1], opacity: [0.5, 1, 1] },
            }}
          />
        </svg>
      </div>
    );
  },
);

EyeOffIcon.displayName = 'EyeOffIcon';
