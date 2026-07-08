import { UserRole } from '@core/types';

export const DEV_DEMO_PASSWORD = 'BeaGuru123!';

export type DemoPersona = {
  email: string;
  label: string;
  role: UserRole;
  school?: string;
  hint: string;
};

/** Akun demo — sinkron dengan be/migrations persona emails. */
export const DEMO_PERSONAS: DemoPersona[] = [
  {
    email: 'beaguru07@gmail.com',
    label: 'Admin Yayasan',
    role: UserRole.ADMIN,
    hint: 'Daftar sekolah, assign kepala sekolah, approve final guru',
  },
  {
    email: 'kepsek.sdn1@bea-guru.dev',
    label: 'Kepsek SDN 1',
    role: UserRole.VALIDATOR,
    school: 'SDN 1 Harapan Bangsa',
    hint: 'Validasi Guru A (Ani) — antrian Penyamaan Berkas',
  },
  {
    email: 'kepsek.smp2@bea-guru.dev',
    label: 'Kepsek SMP 2',
    role: UserRole.VALIDATOR,
    school: 'SMP 2 Cita-Cita Luhur',
    hint: 'Validasi Guru C (Citra)',
  },
  {
    email: 'kepsek.sma3@bea-guru.dev',
    label: 'Kepsek SMA 3',
    role: UserRole.VALIDATOR,
    school: 'SMA 3 Tunas Muda',
    hint: 'Antrian kosong (belum ada pengajuan)',
  },
  {
    email: 'guru.a@bea-guru.dev',
    label: 'Guru Ani (A)',
    role: UserRole.TEACHER,
    school: 'SDN 1 Harapan Bangsa',
    hint: 'Profil PENDING_VALIDATION — menunggu kepsek.sdn1',
  },
  {
    email: 'guru.b@bea-guru.dev',
    label: 'Guru Budi (B)',
    role: UserRole.TEACHER,
    school: 'SDN 1 Harapan Bangsa',
    hint: 'Profil sudah APPROVED',
  },
  {
    email: 'guru.c@bea-guru.dev',
    label: 'Guru Citra (C)',
    role: UserRole.TEACHER,
    school: 'SMP 2 Cita-Cita Luhur',
    hint: 'Profil PENDING_VALIDATION — menunggu kepsek.smp2',
  },
  {
    email: 'donor@bea-guru.dev',
    label: 'Donatur',
    role: UserRole.DONOR,
    hint: 'Donasi & lihat guru penerima',
  },
];

/** Chip isi cepat di halaman login (dev). */
export const LOGIN_FORM_SUGGESTIONS = [
  { id: 'guru', label: 'Guru Honorer', email: 'guru.a@bea-guru.dev' },
  { id: 'kepsek', label: 'Kepala Sekolah', email: 'kepsek.sdn1@bea-guru.dev' },
  { id: 'donor', label: 'Donatur', email: 'donor@bea-guru.dev' },
  { id: 'admin', label: 'Admin Yayasan', email: 'beaguru07@gmail.com' },
] as const;

export const REGISTER_FORM_EXAMPLE = {
  name: 'Siti Rahayu, S.Pd',
  email: 'siti.rahayu@sekolah.sch.id',
  password: DEV_DEMO_PASSWORD,
} as const;
