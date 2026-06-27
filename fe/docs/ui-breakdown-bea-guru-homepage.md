# UI Breakdown Bea Guru: Homepage, Dashboard, dan Guru Penerima Bantuan

Tanggal: 26 Juni 2026  
Mode kerja: senior FE + ponytail, yaitu perubahan sesedikit mungkin, menjaga bisnis flow tetap utuh, dan menghindari over-engineering.

## 1. Tujuan

Rombak visual homepage Bea Guru agar mengikuti arahan klien dan identitas logo baru, tanpa merusak flow bisnis yang sudah ada:

- Pengunjung tetap masuk dari homepage.
- Tombol tetap mengarah ke portal/auth.
- Role admin, donor, guru, validator tetap berjalan.
- Data guru, donasi, validasi, dan laporan tetap memakai alur existing.

Yang diubah terlebih dulu adalah:

- UI dan copy homepage.
- Palette warna.
- Logo di pojok kiri atas.
- Statistik publik.
- Penamaan dashboard dan page penyaluran.
- Struktur tampilan page guru penerima bantuan.

Yang tidak disentuh dulu:

- Auth flow.
- Approval flow guru.
- Validator flow.
- Donation service logic.
- IndexedDB repository, kecuali perlu seed/statistik display.
- Arsitektur besar/backend.

## 2. Analisa Logo

Logo yang diberikan menampilkan:

- Ilustrasi guru memegang kantong bantuan dan buku.
- Lingkaran sebagai simbol perlindungan/komunitas.
- Warna utama copper/burnt orange.
- Background warm ivory.
- Teks tagline memakai hijau abu-abu gelap.
- Kesan brand: sosial, hangat, amanah, edukatif, tidak korporat dingin.

Implikasi UI:

- Homepage jangan terasa seperti fintech modern yang terlalu tajam.
- Jangan pakai palette teal lama sebagai warna utama.
- Jangan dominan ungu, biru gelap, atau gradient AI-style.
- Gunakan tone hangat, bersih, dan terpercaya.
- Copper dipakai untuk brand/action, hijau abu-abu untuk teks pendamping/kepercayaan.

## 3. Palette Warna Awal

Catatan: warna ini diambil dari screenshot logo, jadi masih estimasi. Setelah file logo asli tersedia, lakukan sampling ulang dari PNG/SVG asli.

| Token | Hex | Penggunaan |
| --- | --- | --- |
| `brand-copper` | `#B75A22` | Warna utama logo, heading penting, CTA utama |
| `brand-copper-dark` | `#8E3F16` | Hover CTA, teks kuat, border aktif |
| `brand-copper-soft` | `#D9A174` | Accent lembut, garis pembatas, background badge |
| `brand-ivory` | `#F7EFE7` | Background utama homepage |
| `brand-ivory-light` | `#FFF9F3` | Surface/card ringan |
| `brand-sage` | `#4F5A4E` | Teks tagline, secondary text kuat |
| `brand-sage-muted` | `#758072` | Helper text, meta label |
| `brand-stone` | `#2F302C` | Body text gelap |
| `brand-line` | `#E6D4C4` | Border halus |

Rekomendasi mapping Tailwind sementara:

```ts
const beaGuruTheme = {
  copper: '#B75A22',
  copperDark: '#8E3F16',
  copperSoft: '#D9A174',
  ivory: '#F7EFE7',
  ivoryLight: '#FFF9F3',
  sage: '#4F5A4E',
  sageMuted: '#758072',
  stone: '#2F302C',
  line: '#E6D4C4',
};
```

Prinsip pemakaian:

- `brand-copper` maksimal 15-20% tampilan, supaya tetap elegan.
- `brand-ivory` menjadi dasar.
- `brand-sage` untuk trust copy, subtitle, dan label.
- Hindari semua komponen berubah orange; cukup CTA, heading aksen, ikon, dan stat number.

## 4. Logo Asset

Target file:

- `public/brand/bea-guru-logo.png`, atau
- `public/brand/bea-guru-logo.svg` jika tersedia.

Perubahan komponen:

- Update `src/core/ui/Logo.tsx`.
- Hilangkan ikon buku SVG lama.
- Render image logo asli.
- Sediakan ukuran `sm`, `md`, `lg`.
- Pastikan logo tidak terlalu tinggi di navbar.

Rekomendasi ukuran:

| Size | Desktop | Mobile |
| --- | ---: | ---: |
| `sm` | 32px tinggi | 28px tinggi |
| `md` | 44px tinggi | 36px tinggi |
| `lg` | 72px tinggi | 56px tinggi |

Fallback:

- Jika file logo belum ada, tampilkan teks `BEA GURU` dengan warna copper.
- Jangan biarkan image broken.

## 5. Homepage Baru

### 5.1 Copy Wajib

Judul utama:

> Bea Guru - Bersatu Membantu Guru

Subjudul:

> Menyalurkan Semua Bantuan Anda ke Rekening Guru.

Deskripsi:

> BEA GURU adalah program yang bertujuan menghubungkan donatur dengan para guru berpenghasilan rendah yang aktif mengajar di daerah-daerah terpencil di Indonesia.
>
> Program ini akan menyalurkan semua dana yang terkumpul langsung ke rekening guru penerima, tanpa ada biaya admin, management fee, atau biaya perantara.

Statistik:

- Guru yang Sudah Dibantu: `125`
- Transfer ke Rekening Guru: `596x`
- Jumlah Dana Tersalurkan: `Rp 119.200.000`
- Jumlah Donatur: `165`

### 5.2 Struktur Homepage

Homepage boleh dirombak total, tapi flow tetap:

1. Header logo + tombol masuk portal.
2. Hero utama dengan pesan program.
3. Stat publik.
4. Penjelasan transparansi penyaluran.
5. CTA donasi/masuk portal.
6. Footer.
7. AI assistant tetap boleh ada jika tidak mengganggu.

Wireframe desktop:

```text
┌────────────────────────────────────────────────────┐
│ Logo Bea Guru                         Masuk Portal │
├────────────────────────────────────────────────────┤
│                                                    │
│  [Badge: Bantuan langsung ke rekening guru]        │
│                                                    │
│  Bea Guru - Bersatu Membantu Guru                  │
│  Menyalurkan Semua Bantuan Anda ke Rekening Guru.  │
│                                                    │
│  Deskripsi program 2 paragraf                      │
│                                                    │
│  [Mulai Berdonasi] [Lihat Guru Penerima]           │
│                                                    │
│              [Visual logo/teacher photo]           │
│                                                    │
├────────────────────────────────────────────────────┤
│  125 Guru  | 596x Transfer | Rp119.2jt | 165 Donor │
├────────────────────────────────────────────────────┤
│  Prinsip Transparansi: langsung, tanpa admin,      │
│  tanpa management fee, tanpa perantara             │
└────────────────────────────────────────────────────┘
```

Wireframe mobile:

```text
Logo                         Masuk

Bea Guru - Bersatu Membantu Guru
Menyalurkan Semua Bantuan Anda ke Rekening Guru.

Deskripsi program

[Mulai Berdonasi]
[Lihat Guru Penerima]

125 Guru
596x Transfer
Rp119.2jt Tersalurkan
165 Donatur

Prinsip Transparansi
```

### 5.3 Visual Direction

Hero:

- Background `brand-ivory`.
- Heading copper besar, tapi tetap readable.
- Subjudul sage.
- Gunakan logo sebagai brand signal kuat di first viewport.
- Jika memakai foto guru, pilih foto nyata/terang, bukan stock terlalu dramatis.

Komponen stat:

- Gunakan stat bar atau grid 4 kolom.
- Angka copper, label sage/stone.
- Jangan pakai card terlalu banyak dengan shadow tebal.
- Radius kecil-sedang, sekitar 8-12px.

CTA:

- Primary: background copper, text ivory/white.
- Hover: copper dark.
- Secondary: outline copper atau sage.

Copy pendukung:

- Hindari istilah seperti “campaign”, “ledger”, “philanthropy” di homepage publik.
- Gunakan bahasa orang awam: bantuan, guru, rekening, donatur, laporan.

## 6. Dashboard Kampanye Menjadi Gambaran Umum

Permintaan:

- Nama page: `Gambaran Umum`
- Judul: `Target Program Bea Guru Indonesia`
- Target: `Target Penerima Bantuan Setiap Bulan: 350 guru (tahun ajaran 2026 - 2027)`
- Jumlah guru saat ini: `125 guru`

Progress:

```text
125 / 350 = 35.7% ≈ 36%
```

Catatan engineering:

- Saat ini string `Dashboard Kampanye` dipakai sebagai active tab default.
- Jangan hanya ganti label visual; string condition di komponen juga harus disinkronkan.
- Cara paling aman:
  - Buat konstanta tab name, misalnya `OVERVIEW_TAB = 'Gambaran Umum'`.
  - Pakai konstanta di `App.tsx`, `AppLayout.tsx`, `AdminDashboard.tsx`, `DonorDashboard.tsx`, `TeacherDashboard.tsx`, `ValidatorDashboard.tsx`.

Ponytail decision:

- Jangan bikin routing baru.
- Jangan ubah model role.
- Cukup rename tab dan update condition render.

## 7. Penyaluran Aktif Menjadi Guru Penerima Bantuan

Permintaan:

- Nama page: `Guru Penerima Bantuan`
- Bisa upload foto.
- Bisa input data 125 guru.

### 7.1 UI yang Dibutuhkan

Untuk tahap pertama:

- Rename menu donor `Penyaluran Aktif` menjadi `Guru Penerima Bantuan`.
- Tampilkan daftar guru terverifikasi dalam grid/list.
- Tambahkan data penting:
  - Nama lengkap
  - Jabatan
  - Usia
  - Lama mengajar
  - Jumlah bantuan diterima
  - Rekening masked
  - Alasan menjadi guru
  - Foto profil

Untuk admin:

- Perlu form tambah/edit guru.
- Perlu upload foto profil.
- Perlu upload foto mengajar.
- Perlu import CSV untuk 125 data.

Ponytail staging:

1. Tahap cepat: tampilkan data dari model existing + beberapa field tambahan optional.
2. Tahap berikutnya: admin CRUD sederhana.
3. Tahap lanjut: import CSV.
4. Tahap produksi: backend + storage + permission.

### 7.2 Data Model Tambahan

Model sekarang sudah punya banyak field, tapi belum cukup untuk kebutuhan klien.

Tambahan minimal:

```ts
age?: number;
totalReceivedCount?: number;
totalReceivedAmount?: number;
bankName?: string;
region?: string;
```

Display rekening:

```ts
function maskBankAccount(value: string) {
  return value.replace(/\d(?=\d{3})/g, 'x');
}
```

Catatan:

- Nomor rekening penuh hanya untuk admin.
- Donatur/publik cukup melihat bank dan nomor masked.

## 8. Breakdown Implementasi Aman

### Slice 1: Brand Token dan Logo

Files:

- `src/core/ui/Logo.tsx`
- optional: `public/brand/bea-guru-logo.png`

Acceptance:

- Header memakai logo Bea Guru.
- Tidak ada broken image.
- Logo responsive.

Verify:

- `npm run build`
- Cek homepage desktop/mobile.

### Slice 2: Homepage Copy dan Palette

Files:

- `src/components/pages/LandingPage.tsx`
- optional shared constants untuk stat/brand copy.

Acceptance:

- Copy sesuai permintaan klien.
- Statistik 125, 596x, Rp119.200.000, 165.
- Palette mengikuti logo.
- CTA tetap masuk ke auth.

Verify:

- `npm run build`
- Manual check 375px dan desktop.

### Slice 3: Rename Gambaran Umum

Files:

- `App.tsx`
- `src/core/ui/AppLayout.tsx`
- dashboard pages yang cek `Dashboard Kampanye`.

Acceptance:

- Tab default jadi `Gambaran Umum`.
- Semua role tetap menampilkan overview.
- Tidak ada halaman kosong akibat string mismatch.

Verify:

- Login tiap role dari auth mock.
- Cek tab default muncul.

### Slice 4: Dashboard Target Guru

Files:

- `src/components/pages/DonorDashboard.tsx`
- `src/components/pages/AdminDashboard.tsx` bila perlu.
- optional `src/modules/funding/services/fundingService.ts` jika target/stat disentralisasi.

Acceptance:

- Judul target sesuai.
- Target 350 guru.
- Jumlah saat ini 125.
- Progress 36%.

Verify:

- Build.
- Manual check donor/admin.

### Slice 5: Guru Penerima Bantuan

Files:

- `src/core/ui/AppLayout.tsx`
- `src/components/pages/DonorDashboard.tsx`
- `src/core/types/index.ts`
- seed data jika perlu.

Acceptance:

- Menu berubah menjadi `Guru Penerima Bantuan`.
- List guru mudah dibaca.
- Data rekening masked untuk donor.
- Tidak mengganggu flow sponsor/donasi.

Verify:

- Build.
- Manual check donor dashboard.

## 9. Risiko dan Batasan

Risiko:

- File logo dari screenshot bukan asset produksi; kualitas akan pecah jika dipakai langsung.
- Data 125 guru belum tersedia sebagai file CSV/spreadsheet.
- IndexedDB tidak cocok untuk data produksi lintas perangkat.
- Nomor rekening adalah data sensitif.

Batasan:

- Untuk demo cepat, data bisa disimpan local.
- Untuk produksi, perlu backend, auth real, role permission, dan storage.

Keputusan senior FE:

- Jangan ubah bisnis flow dulu.
- Jangan tambah dependency hanya untuk palette.
- Jangan bikin CMS penuh sebelum data dan backend jelas.
- Homepage boleh total redesign karena itu surface publik, tapi jalur tombol dan role tetap sama.

## 10. Prompt Implementasi untuk AI

```text
Implementasikan UI revisi Bea Guru secara bertahap dan minimal.

Gunakan brief:
- Homepage title: "Bea Guru - Bersatu Membantu Guru"
- Subtitle: "Menyalurkan Semua Bantuan Anda ke Rekening Guru."
- Deskripsi resmi program sesuai dokumen.
- Stats: 125 guru, 596x transfer, Rp 119.200.000 dana tersalurkan, 165 donatur.
- Palette dari logo: copper #B75A22, copper dark #8E3F16, ivory #F7EFE7, sage #4F5A4E.

Jaga bisnis flow:
- Jangan ubah auth.
- Jangan ubah role.
- Jangan ubah approval flow guru.
- Tombol homepage tetap masuk ke portal/auth.
- Donor tetap bisa melihat guru dan berdonasi.

Prioritas:
1. Update logo component agar siap memakai /brand/bea-guru-logo.png atau svg.
2. Rombak homepage visual dan copy.
3. Rename Dashboard Kampanye menjadi Gambaran Umum secara konsisten.
4. Update dashboard target menjadi 350 guru dan 125 saat ini.
5. Rename Penyaluran Aktif menjadi Guru Penerima Bantuan.

Gunakan pendekatan ponytail:
- Diff kecil.
- Reuse komponen existing.
- Jangan tambah dependency.
- Build harus sukses.
```

