-- +goose Up
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_sessions_user_id_idx ON user_sessions (user_id);
CREATE INDEX IF NOT EXISTS user_sessions_expires_at_idx ON user_sessions (expires_at);

CREATE TABLE IF NOT EXISTS rag_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT '',
    tags TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'model')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_chat_messages_user_id_idx ON ai_chat_messages (user_id, created_at);

CREATE TABLE IF NOT EXISTS ai_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    username TEXT NOT NULL DEFAULT '',
    model TEXT NOT NULL,
    action TEXT NOT NULL,
    tokens_used INT NOT NULL DEFAULT 0,
    cost NUMERIC(12, 6) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_logs_user_id_idx ON ai_logs (user_id, created_at DESC);

INSERT INTO rag_documents (title, content, category, tags) VALUES
(
    'Syarat Syarat Calon Guru Penerima Manfaat Bea Guru',
    'Untuk menjadi penerima manfaat di program Bea Guru, seorang guru harus memenuhi kriteria berikut:
1. Berstatus sebagai Guru Honorer atau Guru Sukarelawan di sekolah negeri/swasta di Indonesia.
2. Memiliki gaji bulanan tetap di bawah Rp 1.500.000 per bulan.
3. Sekolah tempat bertugas harus terdaftar di sistem Bea Guru atau bersedia mendaftar bersama Validator (Kepala Sekolah) terkait.
4. Berdedikasi tinggi dan bersedia memberikan laporan berkala bulanan bagi donatur.',
    'Teacher SOP',
    ARRAY['persyaratan', 'guru', 'daftar']
),
(
    'Mekanisme Penyaluran Dana Donasi Yayasan Bea Guru Indonesia',
    'Transparansi adalah prioritas utama kami. Mekanisme pengumpulan dan penyaluran dana adalah:
1. 100% donasi terkumpul dari donatur disalurkan langsung menuju rekening bank guru yang terdaftar.
2. Tidak ada potongan biaya operasional dari donasi terpilih, karena operasional yayasan disokong oleh dana hibah donatur korporat corporate CSR terpisah.
3. Donasi disalurkan selambat-lambatnya tanggal 25 setiap bulannya setelah validator sekolah mengonformasi presensi dan keaktifan mengajar guru terkait.',
    'Transparency',
    ARRAY['keuangan', 'penyaluran', 'operasional']
),
(
    'Tugas Utama Validator (Kepala Sekolah) dalam Sistem',
    'Validator memegang peran kunci penjamin integritas platform. Tugas utama validator adalah:
1. Memvalidasi profil guru yang dikirimkan di bawah institusinya.
2. Memberikan otorisasi laporan bulanan keaktifan mengajar yang dikirimkan guru.
3. Melaporkan kepada pihak yayasan segera jika guru dipindahtugaskan atau mengundurkan diri.',
    'Validator SOP',
    ARRAY['validator', 'tugas', 'validasi']
),
(
    'Panduan Menulis Alasan Pengajuan yang Efektif bagi Guru',
    'Tips menulis alasan pengajuan: ceritakan awal mula menjadi pengajar, deskripsikan kondisi sekolah, dan nyatakan bagaimana bantuan akan membantu murid.',
    'Teacher Tips',
    ARRAY['panduan', 'karakter', 'alasan']
),
(
    'Bagaimana Cara Menjadi Donatur Rutin Yayasan Bea Guru',
    'Pilih dukungan bulanan minimal Rp 50.000 dan Anda akan dipasangkan dengan guru asuh dari database program.',
    'Donor SOP',
    ARRAY['donasi', 'rutin', 'panduan']
);

-- +goose Down
DROP TABLE IF EXISTS ai_logs;
DROP TABLE IF EXISTS ai_chat_messages;
DROP TABLE IF EXISTS rag_documents;
DROP TABLE IF EXISTS user_sessions;
