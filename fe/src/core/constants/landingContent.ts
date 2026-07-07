import { SITE_BRAND, SITE_ORG } from './siteMeta';

export type LandingContentPoint = { title: string; body: string };

const HERO_IMAGE_DEFAULT =
  'https://img.kitabisa.cc/size/800/1c824799-05a1-47d5-9190-a176f761b334.jpg';

export type LandingContent = {
  heroKicker: string;
  heroTitle: string;
  heroLead: string;
  heroImageUrl: string;
  heroCaption: string;
  ctaPrimary: string;
  ctaSecondary: string;
  brandKicker: string;
  brandTitle: string;
  brandDesc: string;
  brandPoints: LandingContentPoint[];
  statLabels: [string, string, string, string];
  galleryKicker: string;
  galleryTitle: string;
  galleryLead: string;
  /** Urutan guru di galeri landing — ID kosong = urut nama (default). */
  featuredTeacherIds: string[];
  trustTitle: string;
  trustLead: string;
  trustPoints: LandingContentPoint[];
  bottomCtaTitle: string;
  bottomCtaLead: string;
  bottomCtaButton: string;
};

export const DEFAULT_LANDING_CONTENT: LandingContent = {
  heroKicker: SITE_ORG,
  heroTitle: 'Donasi Langsung ke Guru Honorer di Seluruh Indonesia',
  heroLead:
    'Bea Guru menghubungkan donatur dengan guru honorer di daerah terpencil. Dana masuk langsung ke rekening guru — tanpa perantara, tanpa potongan admin.',
  heroImageUrl: HERO_IMAGE_DEFAULT,
  heroCaption:
    'Guru honorer terverifikasi yang masih mengajar setiap hari — bantuan Anda membantu mereka fokus pada murid, bukan biaya hidup.',
  ctaPrimary: 'Mulai berdonasi',
  ctaSecondary: 'Lihat dampak',
  brandKicker: 'Identitas program',
  brandTitle: SITE_BRAND,
  brandDesc:
    'Logo Bea Guru melambangkan komitmen kami menghubungkan kebaikan donatur dengan guru honorer di seluruh Indonesia — dengan proses yang jelas, terukur, dan dapat dipertanggungjawabkan.',
  brandPoints: [
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
  ],
  statLabels: [
    'Guru terverifikasi & publik',
    'Transfer ke rekening guru',
    'Dana tersalurkan',
    'Donatur aktif',
  ],
  galleryKicker: 'Guru penerima bantuan',
  galleryTitle: 'Guru yang sudah diverifikasi yayasan',
  galleryLead:
    'Profil dan foto mengajar dari guru penerima bantuan yang telah disetujui kepala sekolah dan yayasan.',
  featuredTeacherIds: [],
  trustTitle: 'Transparansi yang mudah dipahami',
  trustLead:
    'Donatur awam bisa melihat siapa yang dibantu dan bagaimana dana disalurkan, tanpa istilah rumit.',
  trustPoints: [
    {
      title: 'Langsung ke rekening guru',
      body: 'Donasi tidak melalui rekening perantara yayasan.',
    },
    {
      title: 'Tanpa potongan admin',
      body: 'Tidak ada biaya manajemen atau fee tersembunyi.',
    },
    {
      title: 'Profil dan laporan terbuka',
      body: 'Donatur bisa memantau guru penerima dan kegiatan mengajar.',
    },
  ],
  bottomCtaTitle: 'Siap ikut membantu?',
  bottomCtaLead: 'Masuk portal untuk berdonasi atau mengelola data program.',
  bottomCtaButton: 'Masuk portal',
};

function pickPoint(
  parsed: Partial<LandingContentPoint> | undefined,
  fallback: LandingContentPoint,
): LandingContentPoint {
  return {
    title: parsed?.title?.trim() || fallback.title,
    body: parsed?.body?.trim() || fallback.body,
  };
}

function pickPoints(
  parsed: Partial<LandingContentPoint>[] | undefined,
  fallback: LandingContentPoint[],
): LandingContentPoint[] {
  if (!Array.isArray(parsed) || parsed.length === 0) return fallback;
  return fallback.map((fb, i) => pickPoint(parsed[i], fb));
}

export function parseLandingContent(raw: string | null | undefined): LandingContent {
  if (!raw?.trim()) return DEFAULT_LANDING_CONTENT;
  try {
    const parsed = JSON.parse(raw) as Partial<LandingContent>;
    const statIn = Array.isArray(parsed.statLabels) ? parsed.statLabels : [];
    return {
      heroKicker: parsed.heroKicker?.trim() || DEFAULT_LANDING_CONTENT.heroKicker,
      heroTitle: parsed.heroTitle?.trim() || DEFAULT_LANDING_CONTENT.heroTitle,
      heroLead: parsed.heroLead?.trim() || DEFAULT_LANDING_CONTENT.heroLead,
      heroImageUrl: parsed.heroImageUrl?.trim() || DEFAULT_LANDING_CONTENT.heroImageUrl,
      heroCaption: parsed.heroCaption?.trim() || DEFAULT_LANDING_CONTENT.heroCaption,
      ctaPrimary: parsed.ctaPrimary?.trim() || DEFAULT_LANDING_CONTENT.ctaPrimary,
      ctaSecondary: parsed.ctaSecondary?.trim() || DEFAULT_LANDING_CONTENT.ctaSecondary,
      brandKicker: parsed.brandKicker?.trim() || DEFAULT_LANDING_CONTENT.brandKicker,
      brandTitle: parsed.brandTitle?.trim() || DEFAULT_LANDING_CONTENT.brandTitle,
      brandDesc: parsed.brandDesc?.trim() || DEFAULT_LANDING_CONTENT.brandDesc,
      brandPoints: pickPoints(parsed.brandPoints, DEFAULT_LANDING_CONTENT.brandPoints),
      statLabels: [
        statIn[0]?.trim() || DEFAULT_LANDING_CONTENT.statLabels[0],
        statIn[1]?.trim() || DEFAULT_LANDING_CONTENT.statLabels[1],
        statIn[2]?.trim() || DEFAULT_LANDING_CONTENT.statLabels[2],
        statIn[3]?.trim() || DEFAULT_LANDING_CONTENT.statLabels[3],
      ],
      galleryKicker: parsed.galleryKicker?.trim() || DEFAULT_LANDING_CONTENT.galleryKicker,
      galleryTitle: parsed.galleryTitle?.trim() || DEFAULT_LANDING_CONTENT.galleryTitle,
      galleryLead: parsed.galleryLead?.trim() || DEFAULT_LANDING_CONTENT.galleryLead,
      featuredTeacherIds: Array.isArray(parsed.featuredTeacherIds)
        ? parsed.featuredTeacherIds.filter((id): id is string => typeof id === 'string' && id.trim() !== '')
        : DEFAULT_LANDING_CONTENT.featuredTeacherIds,
      trustTitle: parsed.trustTitle?.trim() || DEFAULT_LANDING_CONTENT.trustTitle,
      trustLead: parsed.trustLead?.trim() || DEFAULT_LANDING_CONTENT.trustLead,
      trustPoints: pickPoints(parsed.trustPoints, DEFAULT_LANDING_CONTENT.trustPoints),
      bottomCtaTitle: parsed.bottomCtaTitle?.trim() || DEFAULT_LANDING_CONTENT.bottomCtaTitle,
      bottomCtaLead: parsed.bottomCtaLead?.trim() || DEFAULT_LANDING_CONTENT.bottomCtaLead,
      bottomCtaButton: parsed.bottomCtaButton?.trim() || DEFAULT_LANDING_CONTENT.bottomCtaButton,
    };
  } catch {
    return DEFAULT_LANDING_CONTENT;
  }
}
