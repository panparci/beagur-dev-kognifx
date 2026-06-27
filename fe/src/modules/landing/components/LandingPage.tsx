import React, { useMemo } from 'react';
import { ArrowRight, ShieldCheck, Wallet, Eye } from 'lucide-react';
import Logo from '@core/ui/Logo';
import { RevealOnScroll } from '@core/ui/RevealOnScroll';
import { AiAssistantWidget } from '@modules/ai-assistant/components/AiAssistantWidget';
import { PublicTeachersProvider, useLandingCampaign } from '@core/hooks/usePublicTeachers';
import { PAGE_META, SITE_BRAND, SITE_ORG } from '@core/constants/siteMeta';
import { usePageMeta } from '@core/hooks/usePageMeta';
import { IndonesiaTeachersMap } from './IndonesiaTeachersMap';
import { TeacherPhotoGallery } from './TeacherPhotoGallery';
import { LandingLiveActivity } from './LandingLiveActivity';

interface LandingPageProps {
  onSwitchToAuth: () => void;
}

const HERO_IMAGE =
  'https://img.kitabisa.cc/size/800/1c824799-05a1-47d5-9190-a176f761b334.jpg';

const STAT_LABELS = [
  'Guru terverifikasi & publik',
  'Transfer ke rekening guru',
  'Dana tersalurkan',
  'Donatur aktif',
] as const;

const BRAND_POINTS = [
  {
    title: 'Bea untuk guru honorer',
    body: 'Nama Bea Guru merujuk pada bantuan pendidikan yang disalurkan langsung kepada guru yang masih mengajar di garis depan.',
  },
  {
    title: 'Yayasan resmi & transparan',
    body: `${SITE_ORG} mengelola program dengan profil guru, laporan mengajar, dan jejak donasi yang terbuka untuk donatur.`,
  },
  {
    title: 'Dari hati, sampai ke rekening',
    body: 'Setiap donasi ditujukan ke rekening guru penerima — tanpa perantara dan tanpa potongan biaya administrasi.',
  },
] as const;

const TRUST_POINTS = [
  {
    icon: Wallet,
    title: 'Langsung ke rekening guru',
    body: 'Donasi tidak melalui rekening perantara yayasan.',
  },
  {
    icon: ShieldCheck,
    title: 'Tanpa potongan admin',
    body: 'Tidak ada biaya manajemen atau fee tersembunyi.',
  },
  {
    icon: Eye,
    title: 'Profil dan laporan terbuka',
    body: 'Donatur bisa memantau guru penerima dan kegiatan mengajar.',
  },
] as const;

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatStatValue(value: string, loading: boolean): string {
  return loading ? '…' : value;
}

function LandingPageContent({ onSwitchToAuth }: LandingPageProps) {
  usePageMeta(PAGE_META.landing);

  const { campaign, initialLoading, campaignError } = useLandingCampaign();

  const stats = useMemo(() => {
    const published =
      campaign?.publishedTeachersCount ??
      campaign?.fundedTeachersCount ??
      campaign?.currentTeacherCount ??
      0;
    return [
      {
        value: formatStatValue(String(published), initialLoading && !campaign),
        label: STAT_LABELS[0],
      },
      {
        value: formatStatValue(`${campaign?.transferCount ?? 0}×`, initialLoading && !campaign),
        label: STAT_LABELS[1],
      },
      {
        value: formatStatValue(formatRupiah(campaign?.raised ?? 0), initialLoading && !campaign),
        label: STAT_LABELS[2],
      },
      {
        value: formatStatValue(String(campaign?.donorCount ?? 0), initialLoading && !campaign),
        label: STAT_LABELS[3],
      },
    ];
  }, [campaign, initialLoading]);

  const heroCaption =
    'Guru honorer terverifikasi yang masih mengajar setiap hari — bantuan Anda membantu mereka fokus pada murid, bukan biaya hidup.';

  return (
    <div className="landing-page min-h-[100dvh] bg-bea-ivory text-bea-ink">
      <div className="landing-grain pointer-events-none fixed inset-0 z-[1]" aria-hidden />

      <header className="landing-header sticky top-0 z-20 border-b border-bea-line/60 bg-bea-ivory/95 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 md:px-10">
          <Logo size="md" className="max-w-[96px] md:max-w-[112px]" />
          <button
            type="button"
            onClick={onSwitchToAuth}
            className="bea-btn-secondary min-h-10 px-5 text-sm"
          >
            Masuk portal
          </button>
        </div>
      </header>

      <main className="relative z-[2]">
        <section className="mx-auto max-w-6xl px-5 pt-10 pb-14 md:px-10 md:pt-14 md:pb-20">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <RevealOnScroll>
              <p className="text-sm font-medium text-bea-sage max-w-[65ch]">{SITE_ORG}</p>
              <h1 className="mt-4 font-serif text-[2.25rem] font-semibold leading-[1.1] tracking-tight text-bea-ink md:text-5xl lg:text-[3rem] text-balance">
                Donasi Anda sampai ke rekening guru — tanpa perantara, tanpa potongan.
              </h1>
              <p className="mt-5 max-w-[65ch] text-base leading-relaxed text-bea-sage md:text-lg">
                Bea Guru menghubungkan donatur dengan guru honorer yang masih mengajar di daerah
                terpencil.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button type="button" onClick={onSwitchToAuth} className="bea-btn-primary min-h-12 px-7">
                  Mulai berdonasi
                  <ArrowRight size={16} className="ml-2" aria-hidden />
                </button>
                <a href="#dampak" className="bea-btn-ghost min-h-12 justify-center px-4 sm:justify-start">
                  Lihat dampak
                </a>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={0.08}>
              <figure className="relative">
                <div className="overflow-hidden rounded-2xl border border-bea-line bg-white shadow-soft">
                  <img
                    src={HERO_IMAGE}
                    alt="Guru penerima bantuan Bea Guru sedang mengajar"
                    className="aspect-[4/3] w-full object-cover lg:aspect-[5/4]"
                    loading="eager"
                    decoding="async"
                  />
                </div>
                <figcaption className="mt-3 text-sm leading-relaxed text-bea-sage-muted max-w-md">
                  {heroCaption}
                </figcaption>
              </figure>
            </RevealOnScroll>
          </div>
        </section>

        <section
          id="logo-kami"
          className="landing-brand-intro border-y border-bea-line/70"
          aria-labelledby="landing-brand-title"
        >
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-12 md:px-10 md:py-16 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
            <RevealOnScroll>
              <div className="landing-brand-intro__logo-plain">
                <Logo size="hero" className="landing-brand-intro__logo" />
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={0.08}>
              <div className="landing-brand-intro__copy">
                <p className="landing-brand-intro__kicker">Identitas program</p>
                <h2 id="landing-brand-title" className="landing-brand-intro__title">
                  {SITE_BRAND}
                </h2>
                <p className="landing-brand-intro__desc">
                  Logo Bea Guru melambangkan komitmen kami menghubungkan kebaikan donatur dengan
                  guru honorer di seluruh Indonesia — dengan proses yang jelas, terukur, dan dapat
                  dipertanggungjawabkan.
                </p>
                <ul className="landing-brand-intro__list">
                  {BRAND_POINTS.map((item) => (
                    <li key={item.title}>
                      <strong>{item.title}</strong>
                      <span>{item.body}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </RevealOnScroll>
          </div>
        </section>

        <section
          id="dampak"
          className="landing-stats-bar"
          aria-label="Ringkasan dampak program"
          aria-busy={initialLoading && !campaign}
        >
          {campaignError && (
            <p className="mx-auto max-w-6xl px-5 pt-6 text-center text-sm text-red-700 md:px-10" role="alert">
              {campaignError}
            </p>
          )}
          <RevealOnScroll>
            <div className="landing-stats-bar__inner">
              <dl className="landing-stats-bar__grid">
                {stats.map((item) => (
                  <div key={item.label} className="landing-stats-bar__cell">
                    <dt className="landing-stats-bar__value">{item.value}</dt>
                    <dd className="landing-stats-bar__label">{item.label}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </RevealOnScroll>
        </section>

        <IndonesiaTeachersMap />

        <TeacherPhotoGallery />

        <section className="mx-auto max-w-6xl px-5 py-16 md:px-10 md:py-24">
          <RevealOnScroll>
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-bea-ink md:text-3xl max-w-xl">
              Transparansi yang mudah dipahami
            </h2>
            <p className="mt-4 max-w-[65ch] text-base leading-relaxed text-bea-sage">
              Donatur awam bisa melihat siapa yang dibantu dan bagaimana dana disalurkan, tanpa
              istilah rumit.
            </p>
          </RevealOnScroll>

          <div className="mt-12 grid gap-4 md:grid-cols-3 md:gap-5">
            {TRUST_POINTS.map((item, i) => (
              <RevealOnScroll key={item.title} delay={i * 0.06}>
                <article className="bea-panel h-full p-6 md:p-7 transition-transform duration-200 hover:-translate-y-0.5">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-bea-copper/10 text-bea-copper">
                    <item.icon size={20} strokeWidth={2} aria-hidden />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-bea-ink">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-bea-sage">{item.body}</p>
                </article>
              </RevealOnScroll>
            ))}
          </div>
        </section>

        <section className="border-t border-bea-line bg-bea-ivory-light">
          <RevealOnScroll>
            <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-14 md:flex-row md:items-center md:justify-between md:px-10 md:py-16">
              <div className="max-w-lg">
                <h2 className="font-serif text-2xl font-semibold tracking-tight text-bea-ink md:text-3xl">
                  Siap ikut membantu?
                </h2>
                <p className="mt-3 text-base leading-relaxed text-bea-sage">
                  Masuk portal untuk berdonasi atau mengelola data program.
                </p>
              </div>
              <button
                type="button"
                onClick={onSwitchToAuth}
                className="bea-btn-primary min-h-12 shrink-0 px-8"
              >
                Masuk portal
                <ArrowRight size={16} className="ml-2" aria-hidden />
              </button>
            </div>
          </RevealOnScroll>
        </section>
      </main>

      <footer className="relative z-[2] border-t border-bea-line px-5 py-8 text-center text-xs text-bea-sage-muted">
        <p>© {new Date().getFullYear()} Yayasan Bea Guru Indonesia</p>
      </footer>

      <LandingLiveActivity />
      <AiAssistantWidget />
    </div>
  );
}

const LandingPage: React.FC<LandingPageProps> = (props) => (
  <PublicTeachersProvider>
    <LandingPageContent {...props} />
  </PublicTeachersProvider>
);

export default LandingPage;
