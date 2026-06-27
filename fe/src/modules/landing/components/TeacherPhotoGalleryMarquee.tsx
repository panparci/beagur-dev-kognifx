import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';

const LOGO_SRC = '/brand/bea-guru-logo.png';

/** Satu putaran penuh daftar guru (detik) — semakin besar semakin pelan. */
const MARQUEE_CYCLE_SECONDS = 600;
const WINDOW_BUFFER = 2;

export type TeacherCardData = {
  id: string;
  name: string;
  role: string;
  photo: string;
};

function TeacherGalleryCard({ card }: { card: TeacherCardData }) {
  return (
    <article className="landing-teachers-gallery__card" aria-hidden="true">
      <div className="landing-teachers-gallery__media">
        <img
          src={card.photo}
          alt=""
          className="landing-teachers-gallery__photo"
          loading="lazy"
          decoding="async"
          draggable={false}
        />
        <span className="landing-teachers-gallery__badge">
          <img src={LOGO_SRC} alt="" draggable={false} />
        </span>
      </div>
      <div className="landing-teachers-gallery__body">
        <p className="landing-teachers-gallery__name">{card.name}</p>
        <p className="landing-teachers-gallery__role">{card.role}</p>
      </div>
    </article>
  );
}

type TrackMetrics = {
  cardWidth: number;
  gapPx: number;
};

type TeacherPhotoGalleryMarqueeProps = {
  cards: TeacherCardData[];
};

function readGapPx(el: HTMLElement): number {
  const raw = getComputedStyle(el).getPropertyValue('--gallery-card-gap').trim();
  if (!raw) return 13.6;
  if (raw.endsWith('px')) return Number.parseFloat(raw);
  if (raw.endsWith('rem')) {
    const root = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    return Number.parseFloat(raw) * root;
  }
  return Number.parseFloat(raw) || 13.6;
}

export function TeacherPhotoGalleryMarquee({ cards }: TeacherPhotoGalleryMarqueeProps) {
  const reduce = useReducedMotion();
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const windowStartRef = useRef(0);

  const [viewportWidth, setViewportWidth] = useState(0);
  const [metrics, setMetrics] = useState<TrackMetrics | null>(null);
  const [windowStart, setWindowStart] = useState(0);

  const count = cards.length;
  const cardStep = metrics ? metrics.cardWidth + metrics.gapPx : 0;
  const cycleWidth = count * cardStep;

  useEffect(() => {
    const viewport = viewportRef.current;
    const measure = measureRef.current;
    if (!viewport || !measure) return;

    const syncMetrics = () => {
      setViewportWidth(viewport.clientWidth);
      const cardEl = measure.querySelector('.landing-teachers-gallery__card');
      if (!cardEl) return;
      setMetrics({
        cardWidth: cardEl.getBoundingClientRect().width,
        gapPx: readGapPx(viewport),
      });
    };

    syncMetrics();
    const ro = new ResizeObserver(syncMetrics);
    ro.observe(viewport);
    ro.observe(measure);
    window.addEventListener('resize', syncMetrics);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', syncMetrics);
    };
  }, [count]);

  useEffect(() => {
    if (reduce || count === 0 || cardStep <= 0) return;

    let raf = 0;
    let last = performance.now();
    const speed = cycleWidth / MARQUEE_CYCLE_SECONDS;

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      offsetRef.current += speed * dt;
      if (offsetRef.current >= cycleWidth) {
        offsetRef.current -= cycleWidth;
      }

      const phase = offsetRef.current % cardStep;
      const nextWindowStart = Math.floor(offsetRef.current / cardStep);

      if (trackRef.current) {
        trackRef.current.style.transform = `translate3d(${-phase}px, 0, 0)`;
      }

      if (nextWindowStart !== windowStartRef.current) {
        windowStartRef.current = nextWindowStart;
        setWindowStart(nextWindowStart);
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduce, count, cardStep, cycleWidth]);

  const visibleSlots = useMemo(() => {
    if (count === 0 || cardStep <= 0 || viewportWidth <= 0 || !metrics) return [];

    const slotsNeeded = Math.ceil(viewportWidth / cardStep) + WINDOW_BUFFER * 2 + 1;
    const slots: { key: string; card: TeacherCardData; left: number }[] = [];

    for (let i = -WINDOW_BUFFER; i < slotsNeeded + WINDOW_BUFFER; i += 1) {
      const absoluteIndex = windowStart + i;
      const cardIndex = ((absoluteIndex % count) + count) % count;
      const card = cards[cardIndex];
      if (!card) continue;
      slots.push({
        key: `${card.id}-${absoluteIndex}`,
        card,
        left: i * cardStep,
      });
    }

    return slots;
  }, [cards, count, cardStep, viewportWidth, windowStart, metrics]);

  if (count === 0) {
    return null;
  }

  if (reduce) {
    const staticCards = cards.slice(0, Math.min(cards.length, 12));
    return (
      <div className="landing-teachers-gallery__bleed">
        <div className="landing-teachers-gallery__marquee landing-teachers-gallery__marquee--paused">
          <div className="landing-teachers-gallery__marquee-track landing-teachers-gallery__marquee-track--static">
            {staticCards.map((card) => (
              <TeacherGalleryCard key={card.id} card={card} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-teachers-gallery__bleed" aria-label={`${count} guru penerima bantuan`}>
      <div
        ref={viewportRef}
        className="landing-teachers-gallery__marquee landing-teachers-gallery__marquee-viewport"
      >
        <div ref={trackRef} className="landing-teachers-gallery__marquee-track-js">
          {visibleSlots.map((slot) => (
            <div
              key={slot.key}
              className="landing-teachers-gallery__marquee-item"
              style={{
                left: slot.left,
                width: metrics?.cardWidth,
              }}
            >
              <TeacherGalleryCard card={slot.card} />
            </div>
          ))}
        </div>
      </div>

      <div ref={measureRef} className="landing-teachers-gallery__measure" aria-hidden>
        <TeacherGalleryCard card={cards[0]} />
      </div>
    </div>
  );
}
