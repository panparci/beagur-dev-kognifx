import {
  BookOpen,
  FileText,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  MapPin,
  Sparkles,
  User,
} from 'lucide-react';
import React from 'react';
import { OVERVIEW_TAB } from '@core/constants/tabs';
import type { PortalTutorialStep } from '@core/ui/PortalTutorialOverlay';

export const TEACHER_TUTORIAL_STORAGE_KEY = 'bea-guru-teacher-tutorial-v1';

export type TeacherTutorialStep = PortalTutorialStep & {
  /** Tab portal yang dibuka otomatis saat step ini tampil */
  tab?: string;
};

export const TEACHER_TUTORIAL_STEPS: TeacherTutorialStep[] = [
  {
    id: 'welcome',
    kicker: 'Pengenalan',
    title: 'Selamat datang di Portal Bea Guru',
    body:
      'Portal ini khusus untuk Bapak/Ibu guru honorer. Di sini Anda bisa mengisi data diri, mengajukan bantuan, mengirim laporan bulanan, dan membaca materi pelatihan — semuanya lewat HP atau komputer.',
    tips: [
      'Tidak perlu khawatir salah langkah: data Anda tersimpan otomatis saat mengisi formulir.',
      'Ikuti panduan ini langkah demi langkah. Tekan "Lanjut" untuk melihat penjelasan berikutnya.',
    ],
    icon: React.createElement(GraduationCap, { size: 28, strokeWidth: 1.75, 'aria-hidden': true }),
    tab: OVERVIEW_TAB,
  },
  {
    id: 'navigation',
    kicker: 'Menu',
    title: 'Cara berpindah halaman',
    body:
      'Portal punya beberapa menu. Di komputer/laptop, menu ada di sisi kiri. Di HP, menu ada sebagai tombol bulat di bagian bawah layar — cukup ketuk nama menunya.',
    tips: [
      'Gambaran Umum — ringkasan status Anda.',
      'Profil Saya — tempat mengisi data pendaftaran.',
      'Laporan Bulanan — kirim cerita kegiatan mengajar setiap bulan.',
      'Pelatihan — baca materi peningkatan kompetensi.',
    ],
    icon: React.createElement(LayoutDashboard, { size: 28, strokeWidth: 1.75, 'aria-hidden': true }),
    tab: OVERVIEW_TAB,
  },
  {
    id: 'overview',
    kicker: 'Gambaran Umum',
    title: 'Halaman utama portal',
    body:
      'Halaman "Gambaran Umum" menampilkan status pengajuan Anda dan langkah-langkah yang sudah atau belum selesai. Buka halaman ini kapan saja untuk cek progress pendaftaran.',
    tips: [
      'Perhatikan garis progress di bagian atas — ini menunjukkan tahap pendaftaran Anda.',
      'Status berwarna akan berubah otomatis setelah Kepala Sekolah dan tim Bea Guru memproses.',
    ],
    icon: React.createElement(MapPin, { size: 28, strokeWidth: 1.75, 'aria-hidden': true }),
    tab: OVERVIEW_TAB,
  },
  {
    id: 'profile',
    kicker: 'Profil',
    title: 'Langkah pertama: isi profil Anda',
    body:
      'Buka menu "Profil Saya" lalu isi semua kolom yang diminta: nama lengkap, sekolah, jabatan, lama mengajar, gaji, nomor rekening, nomor WhatsApp, wilayah mengajar, serta foto formal dan foto saat mengajar.',
    tips: [
      'Nomor rekening ditulis seperti: Bank Mandiri - 1234567890.',
      'Setelah semua terisi, tekan tombol kirim/simpan di bawah formulir.',
      'Jika belum selesai, Anda bisa tutup dulu — data tersimpan sebagai draft dan bisa dilanjutkan nanti.',
    ],
    icon: React.createElement(User, { size: 28, strokeWidth: 1.75, 'aria-hidden': true }),
    tab: 'Pengajuan Profil',
  },
  {
    id: 'flow',
    kicker: 'Alur',
    title: 'Empat tahap pendaftaran bantuan',
    body:
      'Setelah profil dikirim, pengajuan Anda melewati empat tahap. Anda tidak perlu menelepon siapa pun — cukup pantau status di portal.',
    tips: [
      '1. Ajukan profil — Anda mengisi dan mengirim data.',
      '2. Validasi Kepala Sekolah — kepala sekolah memverifikasi data Anda.',
      '3. Persetujuan yayasan — tim Bea Guru meninjau pengajuan.',
      '4. Guru penerima bantuan — jika disetujui, Anda resmi masuk program.',
      'Mohon bersabar menunggu. Proses ini membutuhkan waktu beberapa hari.',
    ],
    icon: React.createElement(HelpCircle, { size: 28, strokeWidth: 1.75, 'aria-hidden': true }),
    tab: 'Pengajuan Profil',
  },
  {
    id: 'reports',
    kicker: 'Laporan',
    title: 'Kirim laporan kelas setiap bulan',
    body:
      'Setelah terdaftar, Bapak/Ibu diminta mengirim laporan kegiatan mengajar setiap bulan. Buka menu "Laporan Bulanan", lalu ikuti petunjuk di layar — isi cerita kegiatan, unggah foto jika ada, dan kirim.',
    tips: [
      'Laporan membantu donatur melihat dampak bantuan yang diberikan.',
      'Portal akan menampilkan riwayat laporan yang sudah dikirim.',
      'Jika bingung cara menulis, ada bantuan AI di dalam formulir laporan.',
    ],
    icon: React.createElement(FileText, { size: 28, strokeWidth: 1.75, 'aria-hidden': true }),
    tab: 'Laporan Kelas Bulanan',
  },
  {
    id: 'training',
    kicker: 'Pelatihan',
    title: 'Baca materi pelatihan pedagogi',
    body:
      'Menu "Pelatihan" berisi materi bacaan gratis seputar teknik mengajar, manajemen kelas, dan tips membuat laporan. Baca kapan saja sesuai waktu luang Anda.',
    tips: [
      'Materi bisa dibaca langsung di browser — tidak perlu unduh aplikasi lain.',
      'Manfaatkan materi ini untuk meningkatkan kualitas mengajar di kelas.',
    ],
    icon: React.createElement(BookOpen, { size: 28, strokeWidth: 1.75, 'aria-hidden': true }),
    tab: 'Pelatihan Pedagogi',
  },
  {
    id: 'ai',
    kicker: 'Bantuan',
    title: 'Tombol asisten di pojok layar',
    body:
      'Ada tombol bulat kecil di pojok kanan bawah layar. Itu adalah asisten Bea Guru — bisa membantu menulis alasan pengajuan atau menjawab pertanyaan seputar portal.',
    tips: [
      'Ketuk tombol bulat untuk membuka jendela chat.',
      'Tulis pertanyaan dengan bahasa sederhana, misalnya: "Cara mengisi profil?"',
      'Asisten hanya membantu — keputusan resmi tetap melalui tim Bea Guru.',
    ],
    icon: React.createElement(Sparkles, { size: 28, strokeWidth: 1.75, 'aria-hidden': true }),
    tab: OVERVIEW_TAB,
  },
  {
    id: 'finish',
    kicker: 'Selesai',
    title: 'Anda siap mulai!',
    body:
      'Itu saja panduan singkatnya. Mulai dari mengisi profil jika belum. Jika lupa cara pakainya, buka panduan ini lagi kapan saja lewat tombol "Panduan" di pojok kanan atas halaman.',
    tips: [
      'Simpan nomor WhatsApp tim Bea Guru jika perlu bantuan langsung.',
      'Semangat mengajar — kami mendukung perjuangan Bapak/Ibu di kelas!',
    ],
    icon: React.createElement(GraduationCap, { size: 28, strokeWidth: 1.75, 'aria-hidden': true }),
    tab: OVERVIEW_TAB,
  },
];

export function isTeacherTutorialCompleted(): boolean {
  try {
    return localStorage.getItem(TEACHER_TUTORIAL_STORAGE_KEY) === 'done';
  } catch {
    return false;
  }
}

export function markTeacherTutorialCompleted(): void {
  try {
    localStorage.setItem(TEACHER_TUTORIAL_STORAGE_KEY, 'done');
  } catch {
    /* private browsing */
  }
}
