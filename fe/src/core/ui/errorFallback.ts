export type ErrorPresentation = {
  title: string;
  lead: string;
  explanation: string;
  issueLabel: string;
  issueDetail: string;
  waitNote: string;
  technicalNote?: string;
};

function matchMessage(message: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(message));
}

/** Ubah pesan error teknis menjadi copy yang mudah dipahami guru/pengguna awam. */
export function presentAppError(error: Error | null): ErrorPresentation {
  const raw = (error?.message ?? '').trim() || 'Terjadi gangguan tak terduga pada tampilan.';
  const lower = raw.toLowerCase();

  if (
    matchMessage(lower, [
      /is not defined/,
      /cannot read propert/,
      /undefined is not/,
      /failed to fetch dynamically imported module/,
    ])
  ) {
    return {
      title: 'Maaf, halaman belum bisa ditampilkan',
      lead: 'Bea Guru sedang memuat ulang bagian tampilan portal. Bukan karena kesalahan Bapak/Ibu — ini kendala teknis sementara di sistem kami.',
      explanation:
        'Biasanya terjadi saat aplikasi baru diperbarui atau koneksi internet sempat terputus. Data akun Anda aman; yang perlu dilakukan hanya memuat ulang halaman.',
      issueLabel: 'Jenis kendala',
      issueDetail: 'Beberapa bagian tampilan (animasi transisi portal) belum selesai dimuat dengan benar.',
      waitNote: 'Mohon tunggu sebentar, lalu tekan tombol di bawah. Jika masih bermasalah, coba lagi 1–2 menit kemudian atau hubungi tim Bea Guru.',
      technicalNote: raw,
    };
  }

  if (matchMessage(lower, [/network|fetch|failed to load|connection|timeout|502|503|504/])) {
    return {
      title: 'Maaf, koneksi sedang tidak stabil',
      lead: 'Portal Bea Guru tidak dapat terhubung ke server untuk sementara.',
      explanation:
        'Periksa koneksi internet Bapak/Ibu, lalu muat ulang halaman. Jika Wi‑Fi lemah, coba pindah ke jaringan yang lebih stabil.',
      issueLabel: 'Jenis kendala',
      issueDetail: 'Gangguan jaringan atau server sementara tidak merespons.',
      waitNote: 'Mohon tunggu beberapa saat, lalu coba muat ulang. Tim kami biasanya memulihkan layanan dalam waktu singkat.',
      technicalNote: raw,
    };
  }

  if (matchMessage(lower, [/chunk|loading css chunk|import/])) {
    return {
      title: 'Maaf, pembaruan halaman diperlukan',
      lead: 'Versi halaman di perangkat Bapak/Ibu belum selaras dengan versi terbaru portal.',
      explanation:
        'Ini sering terjadi setelah ada pembaruan sistem. Muat ulang halaman untuk mengunduh versi terbaru.',
      issueLabel: 'Jenis kendala',
      issueDetail: 'File tampilan lama masih tersimpan di perangkat.',
      waitNote: 'Mohon tunggu sebentar saat halaman dimuat ulang — proses ini biasanya hanya beberapa detik.',
      technicalNote: raw,
    };
  }

  return {
    title: 'Maaf, terjadi gangguan pada tampilan',
    lead: 'Portal Bea Guru mengalami kendala teknis yang tidak terduga. Kami mohon maaf atas ketidaknyamanannya.',
    explanation:
      'Tim kami telah menerima catatan gangguan ini. Silakan muat ulang halaman. Jika masalah berulang, coba tutup tab browser lalu buka kembali alamat portal.',
    issueLabel: 'Ringkasan kendala',
    issueDetail: 'Tampilan tidak dapat diselesaikan karena ada error internal pada aplikasi.',
    waitNote: 'Mohon tunggu sebentar, lalu tekan "Muat ulang halaman". Terima kasih atas kesabaran Bapak/Ibu.',
    technicalNote: raw,
  };
}
