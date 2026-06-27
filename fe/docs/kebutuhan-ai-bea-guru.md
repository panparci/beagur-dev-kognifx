# Kebutuhan Revisi dan Pengembangan Bea Guru untuk AI/GPT

Tanggal audit: 26 Juni 2026  
Sumber kebutuhan: catatan revisi klien Argha J Karo Karo dan audit codebase aplikasi Bea Guru.

## 1. Ringkasan Bisnis

Bea Guru adalah program sosial yang menghubungkan donatur dengan guru berpenghasilan rendah yang masih aktif mengajar, terutama di daerah terpencil Indonesia. Nilai utama program adalah transparansi, penyaluran langsung ke rekening guru, dan tidak ada biaya admin, management fee, atau biaya perantara.

Tujuan sistem adalah membuat proses bantuan menjadi mudah dipahami oleh orang awam, mudah dikelola oleh admin/yayasan, mudah diverifikasi oleh kepala sekolah/validator, dan meyakinkan bagi donatur.

## 2. Pesan Utama Brand

Judul utama homepage:

> Bea Guru - Bersatu Membantu Guru

Subjudul homepage:

> Menyalurkan Semua Bantuan Anda ke Rekening Guru.

Deskripsi program:

> BEA GURU adalah program yang bertujuan menghubungkan donatur dengan para guru berpenghasilan rendah yang aktif mengajar di daerah-daerah terpencil di Indonesia.
>
> Program ini akan menyalurkan semua dana yang terkumpul langsung ke rekening guru penerima, tanpa ada biaya admin, management fee, atau biaya perantara.

Tone komunikasi yang disarankan:

- Jelas, hangat, dan mudah dipahami orang awam.
- Hindari istilah teknis yang terlalu berat di tampilan publik.
- Tekankan transparansi 100%, bantuan langsung ke rekening guru, dan dampak nyata.
- Hindari klaim berlebihan yang belum bisa dibuktikan oleh data.

## 3. Revisi Homepage

### 3.1 Copywriting

Ganti konten homepage berikut:

| Area                 | Saat ini                                       | Menjadi                                          |
| -------------------- | ---------------------------------------------- | ------------------------------------------------ |
| Judul utama          | Membangun Masa Depan, Satu Guru Sekaligus      | Bea Guru - Bersatu Membantu Guru                 |
| Badge/subjudul kecil | Pahlawan Pendidikan Tanpa Tanda Jasa           | Menyalurkan Semua Bantuan Anda ke Rekening Guru. |
| Keterangan program   | Program BEA GURU adalah jembatan aksi nyata... | Deskripsi program resmi pada bagian 2            |

### 3.2 Logo dan Warna

Kebutuhan klien:

- Analisa logo Bea Guru yang di-upload oleh klien.
- Gunakan palette warna dari logo tersebut sebagai palette homepage.
- Ganti ikon Bea Guru di pojok kiri atas dengan logo Bea Guru yang di-upload.

Catatan audit:

- Di repo saat ini belum ditemukan file logo lokal seperti `.png`, `.jpg`, `.webp`, atau `.svg`.
- Komponen logo saat ini berada di `src/core/ui/Logo.tsx` dan masih berupa ikon buku SVG + teks `BEA GURU`.
- Implementasi final membutuhkan file logo asli dari klien, idealnya format `SVG` atau `PNG` resolusi tinggi dengan background transparan.

Rekomendasi teknis:

- Simpan logo di `public/brand/bea-guru-logo.svg` atau `public/brand/bea-guru-logo.png`.
- Ubah `Logo.tsx` agar memakai image logo asli, bukan ikon buatan.
- Ekstrak warna primer, sekunder, aksen, dan netral dari logo.
- Terapkan warna tersebut ke homepage, tombol utama, highlight angka, border, dan state aktif.

### 3.3 Statistik Homepage

Data yang diminta:

| Label                     | Nilai |
| ------------------------- | ----: |
| Guru yang Sudah Dibantu   |   125 |
| Transfer ke Rekening Guru |  596x |
| Jumlah Donatur            |   165 |

Catatan audit:

- Saat ini statistik homepage diambil dari `fundingService.getCampaignProgress()`.
- Baseline data di repository masih memakai angka lama: donatur `1200+`, guru terbantu `350+`, dan dana tersalur `Rp 850.000.000+`.
- Label sekarang adalah `Guru Telah Terbantu`, `Donatur Bergabung`, dan `Dana Tersalurkan`.

Kebutuhan perubahan:

- Ganti angka baseline agar mengikuti data klien.
- Ganti kartu `Dana Tersalurkan` menjadi `Transfer ke Rekening Guru: 596x`.
- Bila tetap ingin menampilkan nominal dana, pisahkan sebagai metrik tambahan yang datanya harus dikonfirmasi.

## 4. Revisi Dashboard Kampanye

Nama page:

> Gambaran Umum

Copy yang diganti:

| Area              | Saat ini                             | Menjadi                                                                   |
| ----------------- | ------------------------------------ | ------------------------------------------------------------------------- |
| Judul dashboard   | Kontribusi Pencapaian Target Yayasan | Target Program Bea Guru Indonesia                                         |
| Target            | Target Kampanye: Rp 1.200.000.000    | Target Penerima Bantuan Setiap Bulan: 350 guru (tahun ajaran 2026 - 2027) |
| Progress saat ini | Berbasis total dana terkumpul        | Jumlah Guru Saat Ini: 125 guru                                            |

Logika progress yang disarankan:

- Target bulanan: 350 guru.
- Guru saat ini: 125 guru.
- Persentase pencapaian: `125 / 350 = 35,7%`, dibulatkan menjadi `36%`.
- Progress bar menampilkan pencapaian jumlah guru, bukan nominal dana.

Catatan audit:

- Tab `Dashboard Kampanye` digunakan sebagai default di semua role pada `App.tsx` dan `AppLayout.tsx`.
- Jika namanya diganti ke `Gambaran Umum`, semua pengecekan string aktif tab perlu ikut diubah agar tampilan tidak rusak.
- Halaman donor memiliki blok target kampanye di `src/components/pages/DonorDashboard.tsx`.
- Halaman admin juga memakai `Dashboard Kampanye` untuk statistik dan daftar status guru.

## 5. Revisi Page Penyaluran Aktif

Nama page:

> Guru Penerima Bantuan

Tujuan page:

Menampilkan daftar guru penerima bantuan secara rapi, lengkap, dan mudah dicari oleh admin/donatur. Page ini juga perlu mendukung upload foto dan input data guru karena klien memiliki 125 data guru yang bisa dimasukkan ke website.

### 5.1 Data Guru Minimal

Contoh data dari klien:

| Field                              | Contoh                                                                                                                                                      |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nama Lengkap                       | Carla Welmi Nenvela Dju,S.Pd                                                                                                                                |
| Jabatan                            | Guru Kelas 2                                                                                                                                                |
| Usia                               | 25 Tahun                                                                                                                                                    |
| Lama Mengajar                      | 3 Tahun                                                                                                                                                     |
| Jumlah bantuan yang sudah diterima | 11xx                                                                                                                                                        |
| Nomor Rekening                     | BRI 467201029915xxx                                                                                                                                         |
| Alasan Menjadi Guru                | Menjadi guru memberi kesempatan untuk berbagi pengetahuan dan membantu siswa berkembang dalam pengetahuan, sikap, dan keterampilan. Panggilan Hati dan Jiwa |

### 5.2 Field yang Sudah Ada di Aplikasi

Model `TeacherProfile` saat ini sudah mendukung:

- `fullName`
- `photoUrl`
- `teachingPhotoUrl`
- `jobTitle`
- `yearsOfService`
- `monthlySalary`
- `phoneNumber`
- `bankAccountNumber`
- `reason`
- `status`
- `institutionId`

### 5.3 Field yang Perlu Ditambahkan

Untuk kebutuhan klien, tambahkan:

- `age` atau `birthDate`
- `totalReceivedCount` untuk jumlah bantuan yang sudah diterima, contoh `11x`
- `totalReceivedAmount` bila yayasan ingin menampilkan nominal bantuan
- `bankName` agar tidak mencampur nama bank dan nomor rekening
- `maskedBankAccountNumber` untuk tampilan publik
- `recipientCode` atau ID penerima bantuan
- `region` atau lokasi daerah terpencil
- `isPublished` untuk mengatur apakah profil tampil ke publik/donatur

### 5.4 Tampilan yang Disarankan

Untuk orang awam, daftar guru sebaiknya berbentuk:

- Kartu profil dengan foto, nama, jabatan, lokasi/sekolah, lama mengajar.
- Badge status: Aktif menerima bantuan, Sudah tersalurkan, Menunggu verifikasi.
- Ringkasan alasan menjadi guru maksimal 2-3 baris, dengan tombol lihat detail.
- Tombol admin: tambah guru, edit, upload foto, import data, export data.
- Pencarian berdasarkan nama, sekolah, jabatan, lokasi.
- Filter berdasarkan status, sekolah, daerah, dan jumlah bantuan.

Untuk detail guru:

- Foto profil guru.
- Foto kegiatan mengajar.
- Biodata lengkap.
- Cerita/alasan menjadi guru.
- Riwayat transfer bantuan.
- Nomor rekening hanya tampil penuh untuk admin, tidak untuk publik.

## 6. Bisnis Proses Aplikasi

### 6.1 Aktor Sistem

| Aktor                    | Fungsi                                                                                   |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| Pengunjung publik        | Melihat homepage, memahami program, tertarik menjadi donatur atau mendaftar              |
| Donatur                  | Melihat guru penerima bantuan, berdonasi, melihat riwayat, melihat laporan               |
| Guru                     | Mengisi profil, upload foto, memasukkan rekening, menulis alasan, upload laporan bulanan |
| Validator/Kepala Sekolah | Memeriksa dan memvalidasi data guru dari sekolahnya                                      |
| Admin/Yayasan            | Mengelola sekolah, menyetujui guru, memantau target, ledger, laporan, kebijakan          |
| AI Assistant             | Membantu penulisan narasi, menjawab pertanyaan SOP, dan membantu pengguna awam           |

### 6.2 Alur Guru Penerima Bantuan

1. Guru mengisi profil lengkap.
2. Guru upload foto profil dan foto mengajar.
3. Guru memasukkan jabatan, lama mengajar, gaji, nomor rekening, nomor WhatsApp, dan alasan menjadi guru.
4. Data masuk status `PENDING_VALIDATION`.
5. Validator/kepala sekolah memeriksa data.
6. Jika valid, status menjadi `PENDING_APPROVAL`.
7. Admin/yayasan melakukan persetujuan final.
8. Jika disetujui, status menjadi `APPROVED`.
9. Guru tampil di daftar penerima bantuan.
10. Donatur dapat melihat profil dan menyalurkan bantuan.
11. Guru membuat laporan bulanan.
12. Admin memverifikasi laporan agar bisa tampil ke donatur.

### 6.3 Alur Donasi

1. Donatur masuk ke portal.
2. Donatur melihat daftar guru terverifikasi.
3. Donatur memilih donasi sekali waktu atau rutin.
4. Donatur bisa memilih guru tertentu sebagai guru asuh.
5. Transaksi dicatat.
6. Sistem menampilkan riwayat donasi dan dampak.
7. Dana disalurkan langsung ke rekening guru penerima.
8. Donatur melihat laporan kegiatan guru sebagai bukti transparansi.

Catatan penting:

- Saat ini aplikasi masih mencatat transaksi secara mock/local IndexedDB.
- Belum ada integrasi payment gateway.
- Belum ada bukti transfer, batch transfer, atau rekonsiliasi bank.
- Jika ingin benar-benar dipakai produksi, perlu backend dan storage aman.

### 6.4 Alur Admin/Yayasan

1. Admin melihat gambaran umum target program.
2. Admin melihat jumlah guru saat ini dan target bulanan.
3. Admin mengelola data sekolah dan validator.
4. Admin menyetujui pengajuan guru yang sudah divalidasi.
5. Admin memantau daftar guru penerima bantuan.
6. Admin memantau ledger transaksi.
7. Admin memvalidasi laporan guru.
8. Admin mengatur syarat dan ketentuan.

## 7. Audit Kondisi Teknis Saat Ini

Stack aplikasi:

- React 19
- Vite
- TypeScript
- IndexedDB via `idb`
- `lucide-react` untuk ikon
- `recharts` untuk visualisasi

Penyimpanan data:

- Saat ini menggunakan IndexedDB browser lokal.
- Data seed berada di `src/core/db/db.ts`.
- Repository berada di `src/core/db/repositories.ts`.
- Ada komentar bahwa repository bisa dipindahkan ke Supabase di masa depan.

Halaman utama:

- Homepage: `src/components/pages/LandingPage.tsx`
- Admin dashboard: `src/components/pages/AdminDashboard.tsx`
- Donor dashboard: `src/components/pages/DonorDashboard.tsx`
- Teacher dashboard: `src/components/pages/TeacherDashboard.tsx`
- Validator dashboard: `src/components/pages/ValidatorDashboard.tsx`
- Layout/menu: `src/core/ui/AppLayout.tsx`
- Logo: `src/core/ui/Logo.tsx`

Temuan penting:

- Aplikasi sudah memiliki fondasi bisnis proses yang cukup lengkap.
- Data masih dummy/local, belum siap untuk 125 data produksi jika ingin lintas perangkat/user.
- Statistik lama tidak sesuai dengan angka revisi klien.
- Penamaan halaman belum sesuai permintaan klien.
- Belum ada fitur import 125 data guru dari spreadsheet/CSV.
- Belum ada role admin khusus untuk input massal data guru.
- Nomor rekening perlu pengamanan agar tidak bocor ke publik.
- Logo asli belum tersedia di repo.

## 8. Prioritas Implementasi

### Prioritas 1: Revisi Cepat yang Harus Segera Dikerjakan

- Ganti judul, subjudul, dan deskripsi homepage.
- Ganti statistik homepage ke 125 guru, 596x transfer, 165 donatur.
- Ganti nama `Dashboard Kampanye` menjadi `Gambaran Umum`.
- Ganti judul target menjadi `Target Program Bea Guru Indonesia`.
- Ubah target dari nominal uang menjadi target 350 guru per bulan.
- Tampilkan jumlah guru saat ini 125 dan progress 36%.
- Ganti `Penyaluran Aktif` menjadi `Guru Penerima Bantuan`.

### Prioritas 2: Data Guru 125 Orang

- Tambahkan field usia, jumlah bantuan diterima, dan rekening terstruktur.
- Buat fitur tambah/edit guru dari admin.
- Buat upload foto profil dan foto mengajar dari admin.
- Buat import CSV/spreadsheet untuk memasukkan 125 data dengan cepat.
- Buat validasi data wajib.
- Buat masking rekening di tampilan publik.

### Prioritas 3: Transparansi dan Kemudahan Orang Awam

- Buat halaman detail guru yang mudah dibaca.
- Buat pencarian dan filter guru.
- Buat ringkasan program tanpa istilah teknis.
- Buat CTA donasi yang jelas.
- Buat indikator “dana langsung ke rekening guru”.
- Buat riwayat transfer per guru.

### Prioritas 4: Produksi dan Keamanan

- Pindahkan data dari IndexedDB lokal ke backend/database seperti Supabase.
- Gunakan storage untuk foto guru.
- Tambahkan autentikasi sungguhan.
- Tambahkan permission per role.
- Tambahkan audit log untuk perubahan data rekening.
- Integrasi payment gateway atau pencatatan transfer manual.
- Buat backup/export data.

## 9. Kebutuhan Data untuk Import 125 Guru

Format CSV/spreadsheet yang disarankan:

| Kolom                   | Wajib    | Contoh                             |
| ----------------------- | -------- | ---------------------------------- |
| nama_lengkap            | Ya       | Carla Welmi Nenvela Dju,S.Pd       |
| jabatan                 | Ya       | Guru Kelas 2                       |
| usia                    | Ya       | 25                                 |
| lama_mengajar_tahun     | Ya       | 3                                  |
| sekolah                 | Opsional | SDN ...                            |
| daerah                  | Opsional | NTT                                |
| bank                    | Ya       | BRI                                |
| nomor_rekening          | Ya       | 467201029915xxx                    |
| jumlah_bantuan_diterima | Ya       | 11                                 |
| alasan_menjadi_guru     | Ya       | Menjadi guru memberi kesempatan... |
| foto_profil             | Opsional | URL/file                           |
| foto_mengajar           | Opsional | URL/file                           |
| status                  | Ya       | APPROVED                           |

Validasi yang perlu dilakukan:

- Nama tidak boleh kosong.
- Jabatan tidak boleh kosong.
- Usia harus angka wajar.
- Lama mengajar harus angka.
- Nomor rekening tidak boleh dipublikasikan penuh untuk donor/publik.
- Alasan minimal 30 karakter agar profil tidak kosong.
- Foto bisa diisi belakangan.

## 10. Rekomendasi Fitur AI agar Lebih Canggih dan Mudah Dipakai

Fitur AI yang paling berguna untuk aplikasi ini:

1. Perapih narasi guru  
   Guru/admin menulis alasan mentah, AI merapikan menjadi cerita yang sopan, jujur, dan menyentuh tanpa mengubah fakta.

2. Generator profil publik  
   AI membuat ringkasan 2-3 kalimat dari data guru untuk ditampilkan di kartu profil.

3. Pemeriksa kelengkapan data  
   AI memberi tahu admin data mana yang kurang, seperti foto belum ada, rekening belum rapi, atau alasan terlalu pendek.

4. Import assistant  
   AI membantu membaca data spreadsheet yang tidak rapi dan memetakan kolom ke format sistem.

5. Chatbot FAQ donatur  
   Menjawab pertanyaan umum: bagaimana dana disalurkan, apakah ada biaya admin, bagaimana memilih guru, dan bagaimana laporan diterima.

6. Ringkasan laporan bulanan  
   AI merangkum laporan guru menjadi update singkat untuk donatur.

7. Moderasi konten  
   AI membantu mendeteksi nomor rekening yang tidak sengaja muncul di profil publik, bahasa tidak pantas, atau data sensitif.

Prioritas AI:

- Mulai dari perapih narasi guru dan pemeriksa kelengkapan data.
- Jangan gunakan AI untuk menyetujui kelayakan guru secara otomatis.
- Keputusan validasi tetap harus dilakukan manusia: validator dan admin yayasan.

## 11. Prompt Siap Pakai untuk AI/GPT

Gunakan prompt ini ke AI/GPT untuk meminta implementasi:

```text
Kamu adalah senior frontend engineer dan product analyst. Tolong revisi aplikasi React TypeScript bernama Bea Guru sesuai kebutuhan berikut.

Konteks bisnis:
Bea Guru adalah program yang menghubungkan donatur dengan guru berpenghasilan rendah yang aktif mengajar di daerah terpencil Indonesia. Semua dana terkumpul disalurkan langsung ke rekening guru penerima tanpa biaya admin, management fee, atau perantara.

Revisi homepage:
1. Ganti judul utama menjadi "Bea Guru - Bersatu Membantu Guru".
2. Ganti subjudul/badge menjadi "Menyalurkan Semua Bantuan Anda ke Rekening Guru."
3. Ganti deskripsi program menjadi:
"BEA GURU adalah program yang bertujuan menghubungkan donatur dengan para guru berpenghasilan rendah yang aktif mengajar di daerah-daerah terpencil di Indonesia.

Program ini akan menyalurkan semua dana yang terkumpul langsung ke rekening guru penerima, tanpa ada biaya admin, management fee, atau biaya perantara."
4. Ganti statistik homepage menjadi:
- Guru yang Sudah Dibantu: 125
- Transfer ke Rekening Guru: 596x
- Jumlah Donatur: 165
5. Ganti komponen logo agar memakai logo Bea Guru asli dari file aset. Jika file logo belum tersedia, buat kode yang mudah diarahkan ke `/brand/bea-guru-logo.png` atau `/brand/bea-guru-logo.svg`.
6. Palette warna homepage harus mengikuti warna logo. Jika logo belum tersedia, pertahankan struktur styling dan siapkan token warna yang mudah diganti.

Revisi dashboard:
1. Ganti nama page/tab "Dashboard Kampanye" menjadi "Gambaran Umum".
2. Ganti judul "Kontribusi Pencapaian Target Yayasan" menjadi "Target Program Bea Guru Indonesia".
3. Ganti target kampanye nominal uang menjadi "Target Penerima Bantuan Setiap Bulan: 350 guru (tahun ajaran 2026 - 2027)".
4. Tampilkan "Jumlah Guru saat ini: 125 guru".
5. Progress bar dihitung dari 125/350 = 36%.

Revisi page penyaluran:
1. Ganti nama page/tab "Penyaluran Aktif" menjadi "Guru Penerima Bantuan".
2. Buat halaman daftar guru penerima bantuan yang mendukung tampilan foto dan data guru.
3. Data guru minimal:
- Nama Lengkap
- Jabatan
- Usia
- Lama Mengajar
- Jumlah bantuan yang sudah diterima
- Nomor Rekening
- Alasan Menjadi Guru
4. Pastikan nomor rekening dimasking di tampilan publik/donatur, dan hanya admin yang boleh melihat detail penuh.
5. Tambahkan kebutuhan upload foto profil dan foto mengajar.
6. Siapkan struktur agar 125 data guru bisa diinput, idealnya dengan fitur import CSV/spreadsheet.

Ketentuan teknis:
- Ikuti pola codebase yang sudah ada.
- Jangan merusak role Admin, Donor, Guru, dan Validator.
- Update string active tab secara konsisten di App.tsx, AppLayout.tsx, AdminDashboard.tsx, DonorDashboard.tsx, TeacherDashboard.tsx, dan ValidatorDashboard.tsx bila diperlukan.
- Jika mengubah model data TeacherProfile, update type, seed data, service, dan tampilan yang terkait.
- Setelah implementasi, jalankan build dan perbaiki error TypeScript.
```

## 12. Acceptance Criteria

Homepage dianggap selesai jika:

- Judul, subjudul, dan deskripsi sesuai revisi klien.
- Logo pojok kiri atas memakai aset logo Bea Guru.
- Warna utama mengikuti palette logo.
- Statistik tampil: 125 guru, 596x transfer, 165 donatur.
- Tampilan tetap responsif di mobile dan desktop.

Dashboard dianggap selesai jika:

- Nama page menjadi `Gambaran Umum`.
- Target program menampilkan 350 guru untuk tahun ajaran 2026 - 2027.
- Jumlah guru saat ini 125.
- Progress bar 36%.
- Tidak ada tab kosong akibat rename string.

Page guru penerima bantuan dianggap selesai jika:

- Nama page menjadi `Guru Penerima Bantuan`.
- Bisa menampilkan daftar guru dengan foto dan data utama.
- Bisa menampilkan detail guru.
- Bisa upload foto.
- Bisa input/edit data guru.
- Bisa import 125 data atau minimal struktur data sudah siap.
- Nomor rekening aman untuk tampilan publik.

## 13. Catatan Keputusan Produk

Rekomendasi penting:

- Jangan langsung menampilkan nomor rekening penuh ke publik.
- Jangan mengandalkan IndexedDB untuk data produksi 125 guru karena data hanya tersimpan di browser masing-masing.
- Jika website akan dipakai publik, gunakan backend/database pusat.
- Untuk fase demo cepat, data bisa tetap seed/local dulu, tapi harus diberi label bahwa itu belum produksi.
- Fokus pertama adalah memperjelas pesan brand dan target program, karena ini yang paling terlihat oleh klien dan donatur.
