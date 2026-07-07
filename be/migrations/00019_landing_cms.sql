-- +goose Up
INSERT INTO program_settings (key, value) VALUES (
  'landing',
  '{"heroTitle":"Donasi Langsung ke Guru Honorer di Seluruh Indonesia","heroLead":"Bea Guru menghubungkan donatur dengan guru honorer di daerah terpencil. Dana masuk langsung ke rekening guru — tanpa perantara, tanpa potongan admin.","galleryTitle":"Guru yang sudah diverifikasi yayasan","galleryLead":"Profil dan foto mengajar dari guru penerima bantuan yang telah disetujui kepala sekolah dan yayasan.","brandPoints":[{"title":"Bea untuk guru honorer","body":"Nama Bea Guru merujuk pada bantuan pendidikan yang disalurkan langsung kepada guru yang masih mengajar di garis depan."},{"title":"Yayasan resmi & transparan","body":"Yayasan Bea Guru Indonesia mengelola program dengan profil guru, laporan mengajar, dan jejak donasi yang terbuka untuk donatur."},{"title":"Dari hati, sampai ke rekening","body":"Setiap donasi ditujukan ke rekening guru penerima — tanpa perantara dan tanpa potongan biaya administrasi."}]}'
) ON CONFLICT (key) DO NOTHING;

-- +goose Down
DELETE FROM program_settings WHERE key = 'landing';
