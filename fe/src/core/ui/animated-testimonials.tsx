import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

export type Testimonial = {
  id?: string;
  quote: string;
  name: string;
  designation: string;
  src: string;
};

type AnimatedTestimonialsProps = {
  testimonials: Testimonial[];
  autoplay?: boolean;
  /** Interval autoplay dalam ms — default 5000 (5 detik) */
  autoplayInterval?: number;
  /** Dipanggil saat slide terakhir selesai dan kembali ke awal (satu putaran penuh). */
  onCycleComplete?: () => void;
};

const STACK_DEPTH = 3;

export function AnimatedTestimonials({
  testimonials,
  autoplay = true,
  autoplayInterval = 5000,
  onCycleComplete,
}: AnimatedTestimonialsProps) {
  const [active, setActive] = useState(0);

  const rotations = useMemo(
    () => testimonials.map(() => Math.floor(Math.random() * 21) - 10),
    [testimonials],
  );

  const visibleIndices = useMemo(() => {
    const indices = new Set<number>();
    const depth = Math.min(STACK_DEPTH, testimonials.length);
    for (let i = 0; i < depth; i += 1) {
      indices.add((active - i + testimonials.length) % testimonials.length);
    }
    return indices;
  }, [active, testimonials.length]);

  const goNext = useCallback(() => {
    setActive((prev) => {
      const next = (prev + 1) % testimonials.length;
      if (next === 0 && prev === testimonials.length - 1) {
        onCycleComplete?.();
      }
      return next;
    });
  }, [testimonials.length, onCycleComplete]);

  const goPrev = useCallback(() => {
    setActive((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, [testimonials.length]);

  useEffect(() => {
    if (!autoplay || testimonials.length <= 1) return;
    const interval = setInterval(goNext, autoplayInterval);
    return () => clearInterval(interval);
  }, [autoplay, autoplayInterval, testimonials.length, goNext]);

  if (testimonials.length === 0) {
    return null;
  }

  const activeItem = testimonials[active];

  return (
    <div className="mx-auto max-w-4xl px-4 antialiased md:px-8 lg:px-12">
      <div className="relative grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-16">
        <div>
          <div className="relative mx-auto h-72 w-full max-w-sm md:h-80">
            <AnimatePresence initial={false}>
              {testimonials.map((item, index) => {
                if (!visibleIndices.has(index)) return null;
                const isActiveSlide = index === active;
                const slideKey = item.id ?? `${item.name}-${index}`;
                return (
                  <motion.div
                    key={slideKey}
                    initial={{
                      opacity: 0,
                      scale: 0.92,
                      rotate: rotations[index],
                    }}
                    animate={{
                      opacity: isActiveSlide ? 1 : 0.55,
                      scale: isActiveSlide ? 1 : 0.94,
                      rotate: isActiveSlide ? 0 : rotations[index],
                      zIndex: isActiveSlide ? testimonials.length : testimonials.length - index - 1,
                      y: isActiveSlide ? [0, -24, 0] : 0,
                    }}
                    transition={{ duration: 0.45, ease: 'easeInOut' }}
                    className="absolute inset-0 origin-bottom"
                  >
                    <img
                      src={item.src}
                      alt={item.name}
                      draggable={false}
                      className="h-full w-full rounded-3xl border border-bea-line object-cover object-center shadow-soft"
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex flex-col justify-between py-2 md:py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -16, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <h3 className="font-serif text-2xl font-semibold text-bea-ink">{activeItem.name}</h3>
              <p className="mt-1 text-sm font-medium text-bea-copper">{activeItem.designation}</p>
              <p className="mt-6 text-base leading-relaxed text-bea-sage">
                {activeItem.quote.split(' ').map((word, index) => (
                  <motion.span
                    key={`${active}-${index}`}
                    initial={{ filter: 'blur(4px)', opacity: 0, y: 4 }}
                    animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.18,
                      ease: 'easeInOut',
                      delay: 0.015 * index,
                    }}
                    className="inline-block"
                  >
                    {word}&nbsp;
                  </motion.span>
                ))}
              </p>
            </motion.div>
          </AnimatePresence>

          {testimonials.length > 1 && (
            <div className="mt-8 flex items-center gap-3">
              <button
                type="button"
                onClick={goPrev}
                aria-label="Guru sebelumnya"
                className="group flex h-9 w-9 items-center justify-center rounded-full border border-bea-line bg-white text-bea-ink transition-colors hover:border-bea-copper hover:text-bea-copper"
              >
                <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label="Guru berikutnya"
                className="group flex h-9 w-9 items-center justify-center rounded-full border border-bea-line bg-white text-bea-ink transition-colors hover:border-bea-copper hover:text-bea-copper"
              >
                <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
              </button>
              <span className="text-xs text-bea-sage-muted tabular-nums">
                {active + 1} / {testimonials.length}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
