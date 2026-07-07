import React, { useMemo } from 'react';
import { usePublicTeachers } from '@core/hooks/usePublicTeachers';
import { defaultInstitutionName } from '@core/domain/teacherDisplay';
import type { TeacherProfile } from '@core/types';
import {
  TeacherPhotoGalleryMarquee,
  type TeacherCardData,
} from './TeacherPhotoGalleryMarquee';

function toCard(teacher: TeacherProfile): TeacherCardData {
  const region = teacher.region?.trim();
  const school = defaultInstitutionName(teacher.institutionName);
  const roleParts = [teacher.jobTitle];
  if (region) roleParts.push(region);
  else roleParts.push(school);

  return {
    id: teacher.id ?? teacher.userId,
    name: teacher.fullName,
    role: roleParts.join(' · '),
    photo: teacher.photoUrl || teacher.teachingPhotoUrl,
  };
}

function GallerySkeleton() {
  return (
    <div className="landing-teachers-gallery__bleed" aria-hidden>
      <div className="landing-teachers-gallery__marquee-track landing-teachers-gallery__marquee-track--static">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="landing-teachers-gallery__card landing-teachers-gallery__card--skeleton">
            <div className="landing-teachers-gallery__photo-skeleton" />
            <div className="landing-teachers-gallery__body-skeleton">
              <span />
              <span />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TeacherPhotoGallery({
  kicker = 'Guru penerima bantuan',
  title = 'Wajah di garis depan pendidikan',
  lead = 'Guru honorer terverifikasi yang masih mengajar setiap hari — profil dan foto langsung dari program Bea Guru.',
  featuredTeacherIds = [],
}: {
  kicker?: string;
  title?: string;
  lead?: string;
  featuredTeacherIds?: string[];
}) {
  const { teachers, initialLoading, error } = usePublicTeachers();
  const cards = useMemo(() => {
    const all = teachers.map(toCard);
    if (featuredTeacherIds.length === 0) return all;
    const order = new Map(featuredTeacherIds.map((id, i) => [id, i]));
    return [...all].sort((a, b) => {
      const ai = order.get(a.id) ?? 9999;
      const bi = order.get(b.id) ?? 9999;
      if (ai !== bi) return ai - bi;
      return a.name.localeCompare(b.name, 'id');
    });
  }, [teachers, featuredTeacherIds]);

  return (
    <section
      id="guru-penerima"
      className="landing-teachers-gallery"
      aria-labelledby="landing-teachers-gallery-title"
    >
      <div className="landing-teachers-gallery__inner">
        <header className="landing-teachers-gallery__head">
          <p className="landing-teachers-gallery__kicker">{kicker}</p>
          <h2 id="landing-teachers-gallery-title" className="landing-teachers-gallery__title">
            {title}
          </h2>
          <p className="landing-teachers-gallery__lead">{lead}</p>
        </header>

        {initialLoading ? <GallerySkeleton /> : null}

        {!initialLoading && error ? (
          <p className="landing-teachers-gallery__message landing-teachers-gallery__message--error" role="alert">
            {error}
          </p>
        ) : null}

        {!initialLoading && !error && cards.length === 0 ? (
          <p className="landing-teachers-gallery__message">
            Belum ada profil guru terverifikasi untuk ditampilkan.
          </p>
        ) : null}

        {!initialLoading && !error && cards.length > 0 ? (
          <>
            <TeacherPhotoGalleryMarquee cards={cards} />
            <p className="landing-teachers-gallery__count">
              {cards.length} guru terverifikasi
            </p>
          </>
        ) : null}
      </div>
    </section>
  );
}
