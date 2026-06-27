import { useCallback, useMemo, useState } from 'react';
import { AnimatedTestimonials, Testimonial } from '@core/ui/animated-testimonials';
import { TeacherProfile } from '@core/types';
import { usePublicTeachers } from '@core/hooks/usePublicTeachers';
import { defaultInstitutionName } from '@core/domain/teacherDisplay';

const BATCH_SIZE = 10;

function teacherToTestimonial(teacher: TeacherProfile): Testimonial {
  const quote =
    teacher.reason?.trim() ||
    `${teacher.fullName} mengajar sebagai ${teacher.jobTitle} dan menerima bantuan melalui program Bea Guru.`;

  return {
    id: teacher.id ?? teacher.userId,
    quote,
    name: teacher.fullName,
    designation: `${teacher.jobTitle} · ${defaultInstitutionName(teacher.institutionName)}`,
    src: teacher.photoUrl || teacher.teachingPhotoUrl,
  };
}

function chunkTestimonials(items: Testimonial[], size: number): Testimonial[][] {
  if (items.length === 0) return [];
  const batches: Testimonial[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}

export function TeacherTestimonialsCarousel() {
  const { teachers, initialLoading, error } = usePublicTeachers();
  const [batchIndex, setBatchIndex] = useState(0);

  const allTestimonials = useMemo(() => teachers.map(teacherToTestimonial), [teachers]);
  const batches = useMemo(() => chunkTestimonials(allTestimonials, BATCH_SIZE), [allTestimonials]);
  const batchCount = batches.length;
  const safeBatchIndex = batchCount > 0 ? batchIndex % batchCount : 0;
  const currentBatch = batches[safeBatchIndex] ?? [];

  const handleCycleComplete = useCallback(() => {
    if (batchCount <= 1) return;
    setBatchIndex((prev) => (prev + 1) % batchCount);
  }, [batchCount]);

  const rangeLabel = useMemo(() => {
    if (allTestimonials.length === 0) return '';
    const start = safeBatchIndex * BATCH_SIZE + 1;
    const end = Math.min((safeBatchIndex + 1) * BATCH_SIZE, allTestimonials.length);
    return `${start}–${end} dari ${allTestimonials.length} guru`;
  }, [allTestimonials.length, safeBatchIndex]);

  if (initialLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 md:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-16">
          <div className="mx-auto h-72 w-full max-w-sm animate-pulse rounded-3xl bg-bea-line/60 md:h-80" />
          <div className="space-y-4 py-4">
            <div className="h-8 w-2/3 animate-pulse rounded bg-bea-line/60" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-bea-line/40" />
            <div className="mt-6 space-y-2">
              <div className="h-3 w-full animate-pulse rounded bg-bea-line/40" />
              <div className="h-3 w-full animate-pulse rounded bg-bea-line/40" />
              <div className="h-3 w-4/5 animate-pulse rounded bg-bea-line/40" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-center text-sm text-red-700" role="alert">
        {error}
      </p>
    );
  }

  if (currentBatch.length === 0) {
    return (
      <p className="text-center text-sm text-bea-sage">
        Belum ada profil guru terverifikasi untuk ditampilkan.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {allTestimonials.length > BATCH_SIZE && (
        <p className="text-center text-xs text-bea-sage-muted tabular-nums">{rangeLabel}</p>
      )}
      <AnimatedTestimonials
        key={safeBatchIndex}
        testimonials={currentBatch}
        autoplay
        onCycleComplete={batchCount > 1 ? handleCycleComplete : undefined}
      />
    </div>
  );
}
