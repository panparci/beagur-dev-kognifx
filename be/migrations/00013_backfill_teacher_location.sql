-- +goose Up
-- Backfill koordinat guru dari label wilayah (untuk peta landing page).

UPDATE teacher_profiles tp
SET
    region = v.canonical_region,
    latitude = v.latitude,
    longitude = v.longitude
FROM (
    VALUES
        ('jakarta', 'DKI Jakarta', -6.2088, 106.8456),
        ('dki jakarta', 'DKI Jakarta', -6.2088, 106.8456),
        ('bandung', 'Jawa Barat — Bandung', -6.9175, 107.6191),
        ('bogor', 'Jawa Barat — Bogor', -6.5971, 106.8060),
        ('cirebon', 'Jawa Barat — Cirebon', -6.7320, 108.5523),
        ('surabaya', 'Jawa Timur — Surabaya', -7.2575, 112.7521),
        ('malang', 'Jawa Timur — Malang', -7.9666, 112.6326),
        ('semarang', 'Jawa Tengah — Semarang', -6.9667, 110.4167),
        ('solo', 'Jawa Tengah — Solo', -7.5755, 110.8243),
        ('yogyakarta', 'DI Yogyakarta', -7.7956, 110.3695),
        ('jogja', 'DI Yogyakarta', -7.7956, 110.3695),
        ('medan', 'Sumatera Utara — Medan', 3.5952, 98.6722),
        ('padang', 'Sumatera Barat — Padang', -0.9471, 100.4172),
        ('pekanbaru', 'Riau — Pekanbaru', 0.5071, 101.4478),
        ('batam', 'Kepulauan Riau — Batam', 1.1301, 104.0530),
        ('palembang', 'Sumatera Selatan — Palembang', -2.9761, 104.7754),
        ('lampung', 'Lampung — Bandar Lampung', -5.4292, 105.2625),
        ('bandar lampung', 'Lampung — Bandar Lampung', -5.4292, 105.2625),
        ('denpasar', 'Bali — Denpasar', -8.6705, 115.2126),
        ('bali', 'Bali — Denpasar', -8.6705, 115.2126),
        ('mataram', 'NTB — Mataram', -8.5833, 116.1167),
        ('kupang', 'NTT — Kupang', -10.1772, 123.6070),
        ('pontianak', 'Kalimantan Barat — Pontianak', -0.0263, 109.3425),
        ('banjarmasin', 'Kalimantan Selatan — Banjarmasin', -3.3186, 114.5944),
        ('samarinda', 'Kalimantan Timur — Samarinda', -0.5022, 117.1536),
        ('balikpapan', 'Kalimantan Timur — Balikpapan', -1.2379, 116.8529),
        ('manado', 'Sulawesi Utara — Manado', 1.4748, 124.8421),
        ('makassar', 'Sulawesi Selatan — Makassar', -5.1477, 119.4327),
        ('palu', 'Sulawesi Tengah — Palu', -0.8999, 119.8707),
        ('kendari', 'Sulawesi Tenggara — Kendari', -3.9985, 122.5130),
        ('ambon', 'Maluku — Ambon', -3.6554, 128.1908),
        ('ternate', 'Maluku Utara — Ternate', 0.7900, 127.3848),
        ('jayapura', 'Papua — Jayapura', -2.5337, 140.7181),
        ('merauke', 'Papua — Merauke', -8.4961, 140.3949),
        ('manokwari', 'Papua Barat — Manokwari', -0.8611, 134.0620),
        ('aceh', 'Aceh — Banda Aceh', 5.5483, 95.3238),
        ('banda aceh', 'Aceh — Banda Aceh', 5.5483, 95.3238)
) AS v(alias, canonical_region, latitude, longitude)
WHERE tp.latitude IS NULL
  AND lower(trim(tp.region)) = v.alias;

-- Normalisasi label canonical yang sudah exact match daftar form.
UPDATE teacher_profiles tp
SET
    latitude = v.latitude,
    longitude = v.longitude
FROM (
    VALUES
        ('DKI Jakarta', -6.2088, 106.8456),
        ('Jawa Barat — Bandung', -6.9175, 107.6191),
        ('Jawa Barat — Bogor', -6.5971, 106.8060),
        ('Jawa Barat — Cirebon', -6.7320, 108.5523),
        ('Jawa Timur — Surabaya', -7.2575, 112.7521),
        ('Jawa Timur — Malang', -7.9666, 112.6326),
        ('Jawa Tengah — Semarang', -6.9667, 110.4167),
        ('Jawa Tengah — Solo', -7.5755, 110.8243),
        ('DI Yogyakarta', -7.7956, 110.3695),
        ('Aceh — Banda Aceh', 5.5483, 95.3238),
        ('Sumatera Utara — Medan', 3.5952, 98.6722),
        ('Sumatera Barat — Padang', -0.9471, 100.4172),
        ('Riau — Pekanbaru', 0.5071, 101.4478),
        ('Kepulauan Riau — Batam', 1.1301, 104.0530),
        ('Jambi — Jambi', -1.6101, 103.6131),
        ('Sumatera Selatan — Palembang', -2.9761, 104.7754),
        ('Bangka Belitung — Pangkalpinang', -2.1316, 106.1169),
        ('Bengkulu — Bengkulu', -3.7928, 102.2608),
        ('Lampung — Bandar Lampung', -5.4292, 105.2625),
        ('Banten — Serang', -6.1200, 106.1503),
        ('Bali — Denpasar', -8.6705, 115.2126),
        ('NTB — Mataram', -8.5833, 116.1167),
        ('NTT — Kupang', -10.1772, 123.6070),
        ('Kalimantan Barat — Pontianak', -0.0263, 109.3425),
        ('Kalimantan Tengah — Palangka Raya', -2.2100, 113.9200),
        ('Kalimantan Selatan — Banjarmasin', -3.3186, 114.5944),
        ('Kalimantan Timur — Samarinda', -0.5022, 117.1536),
        ('Kalimantan Timur — Balikpapan', -1.2379, 116.8529),
        ('Kalimantan Utara — Tarakan', 3.3274, 117.5785),
        ('Sulawesi Utara — Manado', 1.4748, 124.8421),
        ('Sulawesi Tengah — Palu', -0.8999, 119.8707),
        ('Sulawesi Selatan — Makassar', -5.1477, 119.4327),
        ('Sulawesi Tenggara — Kendari', -3.9985, 122.5130),
        ('Sulawesi Barat — Mamuju', -2.6726, 118.8860),
        ('Gorontalo', 0.5435, 123.0585),
        ('Maluku — Ambon', -3.6554, 128.1908),
        ('Maluku Utara — Ternate', 0.7900, 127.3848),
        ('Papua Barat — Manokwari', -0.8611, 134.0620),
        ('Papua — Jayapura', -2.5337, 140.7181),
        ('Papua — Merauke', -8.4961, 140.3949)
) AS v(canonical_region, latitude, longitude)
WHERE tp.latitude IS NULL
  AND trim(tp.region) = v.canonical_region;

-- +goose Down
-- Tidak mengembalikan koordinat yang sudah di-backfill.
