import { ArrowRight } from 'lucide-react';
import Logo from '@core/ui/Logo';
import type { LandingContent, LandingContentPoint } from '@core/constants/landingContent';
import { CmsEditable } from './CmsEditable';

type LandingCmsPreviewProps = {
  content: LandingContent;
  onPatch: (patch: Partial<LandingContent>) => void;
};

function BrandPoint({
  point,
  index,
  onChange,
}: {
  point: LandingContentPoint;
  index: number;
  onChange: (next: LandingContentPoint) => void;
}) {
  return (
    <li className="border-l-2 border-bea-copper/35 pl-3">
      <CmsEditable
        label={`Poin ${index + 1} judul`}
        value={point.title}
        onChange={(title) => onChange({ ...point, title })}
        className="block font-semibold text-sm text-bea-ink"
        as="strong"
      />
      <CmsEditable
        label={`Poin ${index + 1} deskripsi`}
        value={point.body}
        onChange={(body) => onChange({ ...point, body })}
        multiline
        className="block text-xs text-bea-sage-muted mt-0.5"
        as="span"
      />
    </li>
  );
}

export function LandingCmsPreview({ content, onPatch }: LandingCmsPreviewProps) {
  const patchPoints = (key: 'brandPoints' | 'trustPoints', index: number, next: LandingContentPoint) => {
    const points = [...content[key]];
    points[index] = next;
    onPatch({ [key]: points });
  };

  return (
    <div className="landing-cms-preview landing-page text-bea-ink">
      <p className="landing-cms-preview__hint">
        Klik ikon pensil pada teks untuk mengubah. Angka statistik diisi otomatis dari data program.
      </p>

      {/* Hero */}
      <section className="landing-cms-preview__section mx-auto max-w-5xl px-5 py-8 md:px-8">
        <div className="grid items-start gap-8 lg:grid-cols-2">
          <div>
            <CmsEditable
              label="Kicker hero"
              value={content.heroKicker}
              onChange={(heroKicker) => onPatch({ heroKicker })}
              className="text-sm font-medium text-bea-sage"
              as="p"
            />
            <CmsEditable
              label="Judul hero"
              value={content.heroTitle}
              onChange={(heroTitle) => onPatch({ heroTitle })}
              className="mt-3 font-serif text-2xl md:text-3xl font-semibold leading-tight"
              as="h1"
            />
            <CmsEditable
              label="Lead hero"
              value={content.heroLead}
              onChange={(heroLead) => onPatch({ heroLead })}
              multiline
              className="mt-4 text-sm md:text-base text-bea-sage leading-relaxed"
              as="p"
            />
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="bea-btn-primary min-h-10 px-5 text-sm pointer-events-none inline-flex items-center">
                <CmsEditable
                  label="Tombol utama"
                  value={content.ctaPrimary}
                  onChange={(ctaPrimary) => onPatch({ ctaPrimary })}
                  className="text-white font-semibold"
                  as="span"
                />
                <ArrowRight size={14} className="ml-1.5 shrink-0" aria-hidden />
              </span>
              <span className="bea-btn-ghost min-h-10 px-4 text-sm pointer-events-none">
                <CmsEditable
                  label="Tombol sekunder"
                  value={content.ctaSecondary}
                  onChange={(ctaSecondary) => onPatch({ ctaSecondary })}
                  as="span"
                />
              </span>
            </div>
          </div>
          <div>
            <div className="relative overflow-hidden rounded-2xl border border-bea-line bg-white shadow-soft">
              <img
                src={content.heroImageUrl}
                alt=""
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="absolute top-2 right-2">
                <CmsEditable
                  label="URL foto hero"
                  value={content.heroImageUrl}
                  onChange={(heroImageUrl) => onPatch({ heroImageUrl })}
                  className="rounded-lg bg-white/95 px-2 py-1 text-[10px] font-mono text-bea-sage max-w-[12rem] truncate"
                  as="span"
                />
              </div>
            </div>
            <CmsEditable
              label="Caption foto"
              value={content.heroCaption}
              onChange={(heroCaption) => onPatch({ heroCaption })}
              multiline
              className="mt-2 text-xs text-bea-sage-muted leading-relaxed"
              as="p"
            />
          </div>
        </div>
      </section>

      {/* Brand */}
      <section className="landing-cms-preview__section landing-brand-intro border-y border-bea-line/70">
        <div className="mx-auto grid max-w-5xl items-center gap-8 px-5 py-8 md:px-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="flex justify-center lg:justify-start">
            <Logo size="hero" className="landing-brand-intro__logo max-w-[14rem] opacity-90" />
          </div>
          <div>
            <CmsEditable
              label="Kicker identitas"
              value={content.brandKicker}
              onChange={(brandKicker) => onPatch({ brandKicker })}
              className="landing-brand-intro__kicker"
              as="p"
            />
            <CmsEditable
              label="Judul identitas"
              value={content.brandTitle}
              onChange={(brandTitle) => onPatch({ brandTitle })}
              className="landing-brand-intro__title mt-2"
              as="h2"
            />
            <CmsEditable
              label="Deskripsi identitas"
              value={content.brandDesc}
              onChange={(brandDesc) => onPatch({ brandDesc })}
              multiline
              className="landing-brand-intro__desc mt-3"
              as="p"
            />
            <ul className="landing-brand-intro__list mt-4 space-y-3">
              {content.brandPoints.map((point, i) => (
                <BrandPoint
                  key={i}
                  point={point}
                  index={i}
                  onChange={(next) => patchPoints('brandPoints', i, next)}
                />
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Stats labels */}
      <section className="landing-cms-preview__section landing-stats-bar">
        <div className="landing-stats-bar__inner max-w-5xl mx-auto">
          <dl className="landing-stats-bar__grid">
            {content.statLabels.map((label, i) => (
              <div key={i} className="landing-stats-bar__cell">
                <dt className="landing-stats-bar__value text-bea-sage-muted">···</dt>
                <dd className="landing-stats-bar__label">
                  <CmsEditable
                    label={`Label statistik ${i + 1}`}
                    value={label}
                    onChange={(v) => {
                      const statLabels = [...content.statLabels] as LandingContent['statLabels'];
                      statLabels[i] = v;
                      onPatch({ statLabels });
                    }}
                    as="span"
                  />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Gallery header */}
      <section className="landing-cms-preview__section landing-teachers-gallery !bg-[#2f302c] !py-10">
        <div className="landing-teachers-gallery__inner max-w-5xl mx-auto px-5">
          <CmsEditable
            label="Kicker galeri"
            value={content.galleryKicker}
            onChange={(galleryKicker) => onPatch({ galleryKicker })}
            className="landing-teachers-gallery__kicker"
            as="p"
          />
          <CmsEditable
            label="Judul galeri"
            value={content.galleryTitle}
            onChange={(galleryTitle) => onPatch({ galleryTitle })}
            className="landing-teachers-gallery__title mt-2"
            as="h2"
          />
          <CmsEditable
            label="Deskripsi galeri"
            value={content.galleryLead}
            onChange={(galleryLead) => onPatch({ galleryLead })}
            multiline
            className="landing-teachers-gallery__lead mt-2"
            as="p"
          />
          <p className="landing-teachers-gallery__count mt-4">Foto guru diisi otomatis dari profil terverifikasi</p>
        </div>
      </section>

      {/* Trust */}
      <section className="landing-cms-preview__section mx-auto max-w-5xl px-5 py-10 md:px-8">
        <CmsEditable
          label="Judul transparansi"
          value={content.trustTitle}
          onChange={(trustTitle) => onPatch({ trustTitle })}
          className="font-serif text-xl font-semibold"
          as="h2"
        />
        <CmsEditable
          label="Lead transparansi"
          value={content.trustLead}
          onChange={(trustLead) => onPatch({ trustLead })}
          multiline
          className="mt-3 text-sm text-bea-sage"
          as="p"
        />
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {content.trustPoints.map((point, i) => (
            <article key={i} className="bea-panel p-4">
              <CmsEditable
                label={`Kartu ${i + 1} judul`}
                value={point.title}
                onChange={(title) => patchPoints('trustPoints', i, { ...point, title })}
                className="text-sm font-semibold"
                as="h3"
              />
              <CmsEditable
                label={`Kartu ${i + 1} teks`}
                value={point.body}
                onChange={(body) => patchPoints('trustPoints', i, { ...point, body })}
                multiline
                className="mt-1 text-xs text-bea-sage"
                as="p"
              />
            </article>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="landing-cms-preview__section border-t border-bea-line bg-bea-ivory-light">
        <div className="mx-auto max-w-5xl px-5 py-8 md:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CmsEditable
              label="Judul CTA bawah"
              value={content.bottomCtaTitle}
              onChange={(bottomCtaTitle) => onPatch({ bottomCtaTitle })}
              className="font-serif text-xl font-semibold"
              as="h2"
            />
            <CmsEditable
              label="Lead CTA bawah"
              value={content.bottomCtaLead}
              onChange={(bottomCtaLead) => onPatch({ bottomCtaLead })}
              multiline
              className="mt-2 text-sm text-bea-sage"
              as="p"
            />
          </div>
          <span className="bea-btn-primary min-h-10 px-6 text-sm pointer-events-none shrink-0">
            <CmsEditable
              label="Tombol CTA bawah"
              value={content.bottomCtaButton}
              onChange={(bottomCtaButton) => onPatch({ bottomCtaButton })}
              className="text-white font-semibold"
              as="span"
            />
          </span>
        </div>
      </section>
    </div>
  );
}
