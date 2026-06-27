import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { usePublicTeachers } from '@core/hooks/usePublicTeachers';
import { defaultInstitutionName } from '@core/domain/teacherDisplay';
import type { TeacherProfile } from '@core/types';

type LiveActivityItem = {
  id: string;
  name: string;
  message: React.ReactNode;
  photo?: string;
};

const ROTATE_MS = 5500;
const INITIAL_DELAY_MS = 2200;

const FALLBACK_ITEMS: LiveActivityItem[] = [
  {
    id: 'demo-1',
    name: 'Guru Ani R.',
    message: (
      <>
        Mendapatkan <strong>bantuan donasi</strong> dari donatur Bea Guru
      </>
    ),
  },
  {
    id: 'demo-2',
    name: 'Guru Budi S.',
    message: (
      <>
        Menerima <strong>dukungan bulanan</strong> · Nusa Tenggara Timur
      </>
    ),
  },
  {
    id: 'demo-3',
    name: 'Guru Citra M.',
    message: (
      <>
        Baru saja <strong>terverifikasi</strong> sebagai guru penerima bantuan
      </>
    ),
  },
];

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function teacherLabel(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Guru';
  if (parts.length === 1) return `Guru ${parts[0]}`;
  const first = parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  return `Guru ${first} ${lastInitial}.`;
}

function buildActivities(teachers: TeacherProfile[]): LiveActivityItem[] {
  if (teachers.length === 0) return FALLBACK_ITEMS;

  const pool = teachers.slice(0, 24);
  const items: LiveActivityItem[] = [];

  pool.forEach((teacher, index) => {
    const name = teacherLabel(teacher.fullName);
    const region = teacher.region?.trim();
    const school = defaultInstitutionName(teacher.institutionName);
    const photo = teacher.photoUrl || teacher.teachingPhotoUrl;
    const amount = teacher.totalReceivedAmount;
    const key = teacher.id ?? teacher.userId;

    const variants: LiveActivityItem[] = [
      {
        id: `${key}-donasi-${index}`,
        name,
        photo,
        message: (
          <>
            Mendapatkan <strong>bantuan donasi</strong> melalui program Bea Guru
          </>
        ),
      },
      {
        id: `${key}-region-${index}`,
        name,
        photo,
        message: region ? (
          <>
            Menerima dukungan donatur · <strong>{region}</strong>
          </>
        ) : (
          <>
            Menerima dukungan donatur · <strong>{school}</strong>
          </>
        ),
      },
    ];

    if (amount && amount > 0) {
      variants.push({
        id: `${key}-amount-${index}`,
        name,
        photo,
        message: (
          <>
            Telah menerima bantuan sebesar <strong>{formatRupiah(amount)}</strong>
          </>
        ),
      });
    }

    items.push(variants[index % variants.length]);
  });

  return items.length > 0 ? items : FALLBACK_ITEMS;
}

function ActivityAvatar({ name, photo }: { name: string; photo?: string }) {
  const initials = name
    .replace(/^Guru\s+/i, '')
    .split(/\s+/)
    .map((p) => p.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (photo) {
    return (
      <img src={photo} alt="" className="landing-live-activity__avatar" loading="lazy" />
    );
  }

  return (
    <span className="landing-live-activity__avatar landing-live-activity__avatar--fallback" aria-hidden>
      {initials || 'BG'}
    </span>
  );
}

export function LandingLiveActivity() {
  const reduce = useReducedMotion();
  const { teachers, initialLoading } = usePublicTeachers();
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  const items = useMemo(() => buildActivities(teachers), [teachers]);
  const current = items[index % items.length];

  useEffect(() => {
    const showTimer = window.setTimeout(() => setVisible(true), INITIAL_DELAY_MS);
    return () => window.clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    if (!visible || items.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [visible, items.length]);

  if (initialLoading && teachers.length === 0) {
    return null;
  }

  const motionProps = reduce
    ? {}
    : {
        initial: { opacity: 0, x: -20, y: 8 },
        animate: { opacity: 1, x: 0, y: 0 },
        exit: { opacity: 0, x: -16, y: 4 },
        transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
      };

  return (
    <div
      className="landing-live-activity-root"
      aria-live="polite"
      aria-atomic="true"
      aria-label="Aktivitas donasi terbaru"
    >
      <AnimatePresence mode="wait">
        {visible && current ? (
          <motion.div
            key={current.id}
            className="landing-live-activity"
            {...motionProps}
          >
            <span className="landing-live-activity__accent" aria-hidden />
            <span className="landing-live-activity__live" aria-hidden>
              <span className="landing-live-activity__live-dot" />
              Live
            </span>
            <ActivityAvatar name={current.name} photo={current.photo} />
            <div className="landing-live-activity__body">
              <p className="landing-live-activity__name">{current.name}</p>
              <p className="landing-live-activity__message">{current.message}</p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
