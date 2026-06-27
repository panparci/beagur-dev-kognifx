-- +goose Up
-- 10 guru demo APPROVED + published untuk carousel landing page (public/teachers).

INSERT INTO users (id, email, name) VALUES
    ('11111111-1111-1111-1111-111111111109', 'guru.demo01@bea-guru.dev', 'Ibu Siti Rahayu'),
    ('11111111-1111-1111-1111-111111111110', 'guru.demo02@bea-guru.dev', 'Pak Rudi Hartono'),
    ('11111111-1111-1111-1111-111111111111', 'guru.demo03@bea-guru.dev', 'Ibu Dewi Lestari'),
    ('11111111-1111-1111-1111-111111111112', 'guru.demo04@bea-guru.dev', 'Pak Agus Salim'),
    ('11111111-1111-1111-1111-111111111113', 'guru.demo05@bea-guru.dev', 'Ibu Rina Wulandari'),
    ('11111111-1111-1111-1111-111111111114', 'guru.demo06@bea-guru.dev', 'Pak Hendra Kusuma'),
    ('11111111-1111-1111-1111-111111111115', 'guru.demo07@bea-guru.dev', 'Ibu Fitri Anggraini'),
    ('11111111-1111-1111-1111-111111111116', 'guru.demo08@bea-guru.dev', 'Pak Yoga Pratama'),
    ('11111111-1111-1111-1111-111111111117', 'guru.demo09@bea-guru.dev', 'Ibu Maya Sari')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.code = 'TEACHER'
WHERE u.id IN (
    '11111111-1111-1111-1111-111111111109',
    '11111111-1111-1111-1111-111111111110',
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111112',
    '11111111-1111-1111-1111-111111111113',
    '11111111-1111-1111-1111-111111111114',
    '11111111-1111-1111-1111-111111111115',
    '11111111-1111-1111-1111-111111111116',
    '11111111-1111-1111-1111-111111111117'
)
ON CONFLICT DO NOTHING;

-- Pastikan Guru Budi (B) tetap published untuk carousel
UPDATE teacher_profiles SET
    full_name = 'Guru Budi (B)',
    status = 'APPROVED'::application_status,
    is_published = TRUE,
    rejected_by = NULL
WHERE id = '33333333-3333-3333-3333-333333333301';

INSERT INTO teacher_profiles (
    id, user_id, institution_id, full_name, photo_url, teaching_photo_url,
    job_title, years_of_service, age, monthly_salary, phone_number,
    bank_name, bank_account_number, total_received_count, total_received_amount,
    region, reason, status, is_published
) VALUES
(
    '33333333-3333-3333-3333-333333333304',
    '11111111-1111-1111-1111-111111111109',
    '22222222-2222-2222-2222-222222222201',
    'Ibu Siti Rahayu',
    'https://images.unsplash.com/photo-1594744803329-e58b31de8af5?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=600',
    'Guru Honorer Kelas Awal', 7, 34, 620000, '081210010001',
    'BNI', '100010001', 6, 3100000, 'Jakarta',
    'Setiap hari saya menyeberangi sungai kecil untuk mengajar di SDN 1. Gaji honorer Rp 620 ribu belum cukup untuk kebutuhan keluarga, tapi semangat mengajar murid tetap saya jaga.',
    'APPROVED', TRUE
),
(
    '33333333-3333-3333-3333-333333333305',
    '11111111-1111-1111-1111-111111111110',
    '22222222-2222-2222-2222-222222222201',
    'Pak Rudi Hartono',
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&q=80&w=600',
    'Guru Honorer IPA', 9, 38, 580000, '081210010002',
    'Mandiri', '100010002', 9, 4500000, 'Jakarta',
    'Saya mengajar sains dengan alat peraga seadanya. Bantuan Bea Guru membantu saya fokus mengajar tanpa khawatir biaya hidup bulanan.',
    'APPROVED', TRUE
),
(
    '33333333-3333-3333-3333-333333333306',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222202',
    'Ibu Dewi Lestari',
    'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1497633768975-480d2a01d4e7?auto=format&fit=crop&q=80&w=600',
    'Guru Honorer Bahasa Inggris', 5, 29, 700000, '081210010003',
    'BCA', '100010003', 4, 2800000, 'Bandung',
    'Murid-murid SMP saya antusias belajar bahasa Inggris meski sekolah minim fasilitas. Program ini memberi harapan agar saya bisa terus mengajar dengan layak.',
    'APPROVED', TRUE
),
(
    '33333333-3333-3333-3333-333333333307',
    '11111111-1111-1111-1111-111111111112',
    '22222222-2222-2222-2222-222222222202',
    'Pak Agus Salim',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=600',
    'Guru Honorer Matematika', 8, 36, 650000, '081210010004',
    'BRI', '100010004', 7, 3900000, 'Bandung',
    'Matematika adalah fondasi murid saya menuju masa depan. Upah honorer yang kecil tidak menghentikan dedikasi, dan bantuan donatur sangat berarti bagi keluarga kami.',
    'APPROVED', TRUE
),
(
    '33333333-3333-3333-3333-333333333308',
    '11111111-1111-1111-1111-111111111113',
    '22222222-2222-2222-2222-222222222203',
    'Ibu Rina Wulandari',
    'https://images.unsplash.com/photo-1580894732444-8febeb28a57b?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=600',
    'Guru Honorer Seni Budaya', 6, 31, 720000, '081210010005',
    'BCA', '100010005', 5, 2500000, 'Surabaya',
    'Melalui seni, murid SMA belajar ekspresi dan kepercayaan diri. Saya berharap bantuan ini meringankan beban ekonomi agar bisa terus membimbing mereka.',
    'APPROVED', TRUE
),
(
    '33333333-3333-3333-3333-333333333309',
    '11111111-1111-1111-1111-111111111114',
    '22222222-2222-2222-2222-222222222203',
    'Pak Hendra Kusuma',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=600',
    'Guru Honorer Olahraga', 10, 40, 550000, '081210010006',
    'Mandiri', '100010006', 12, 6000000, 'Surabaya',
    'Olahraga mengajarkan disiplin dan kerja sama. Meski gaji honorer rendah, saya bangga melihat murid tumbuh sehat — bantuan Bea Guru sangat membantu.',
    'APPROVED', TRUE
),
(
    '33333333-3333-3333-3333-333333333310',
    '11111111-1111-1111-1111-111111111115',
    '22222222-2222-2222-2222-222222222201',
    'Ibu Fitri Anggraini',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=600',
    'Guru Honorer PKN', 4, 27, 680000, '081210010007',
    'BNI', '100010007', 3, 1800000, 'Jakarta',
    'Saya mengajarkan nilai kebangsaan dan kewarganegaraan di daerah terpencil. Donasi langsung ke rekening guru membuat saya merasa dihargai dan didukung.',
    'APPROVED', TRUE
),
(
    '33333333-3333-3333-3333-333333333311',
    '11111111-1111-1111-1111-111111111116',
    '22222222-2222-2222-2222-222222222202',
    'Pak Yoga Pratama',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=600',
    'Guru Honorer Informatika', 3, 26, 750000, '081210010008',
    'BCA', '100010008', 2, 1500000, 'Bandung',
    'Saya memperkenalkan dasar komputer dengan laptop sekolah yang terbatas. Bantuan bulanan membantu saya tetap mengajar sambil mengejar pendidikan lanjutan.',
    'APPROVED', TRUE
),
(
    '33333333-3333-3333-3333-333333333312',
    '11111111-1111-1111-1111-111111111117',
    '22222222-2222-2222-2222-222222222203',
    'Ibu Maya Sari',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1497633768975-480d2a01d4e7?auto=format&fit=crop&q=80&w=600',
    'Guru Honorer Biologi', 7, 33, 690000, '081210010009',
    'BRI', '100010009', 8, 4200000, 'Surabaya',
    'Praktikum biologi kami sederhana, tapi murid tetap antusias. Bea Guru memberi napas baru agar saya bisa fokus mengembangkan pembelajaran di kelas.',
    'APPROVED', TRUE
)
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    photo_url = EXCLUDED.photo_url,
    teaching_photo_url = EXCLUDED.teaching_photo_url,
    job_title = EXCLUDED.job_title,
    reason = EXCLUDED.reason,
    status = EXCLUDED.status,
    is_published = EXCLUDED.is_published,
    institution_id = EXCLUDED.institution_id;

-- +goose Down
DELETE FROM teacher_profiles WHERE id IN (
    '33333333-3333-3333-3333-333333333304',
    '33333333-3333-3333-3333-333333333305',
    '33333333-3333-3333-3333-333333333306',
    '33333333-3333-3333-3333-333333333307',
    '33333333-3333-3333-3333-333333333308',
    '33333333-3333-3333-3333-333333333309',
    '33333333-3333-3333-3333-333333333310',
    '33333333-3333-3333-3333-333333333311',
    '33333333-3333-3333-3333-333333333312'
);
DELETE FROM user_roles WHERE user_id IN (
    '11111111-1111-1111-1111-111111111109',
    '11111111-1111-1111-1111-111111111110',
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111112',
    '11111111-1111-1111-1111-111111111113',
    '11111111-1111-1111-1111-111111111114',
    '11111111-1111-1111-1111-111111111115',
    '11111111-1111-1111-1111-111111111116',
    '11111111-1111-1111-1111-111111111117'
);
DELETE FROM users WHERE id IN (
    '11111111-1111-1111-1111-111111111109',
    '11111111-1111-1111-1111-111111111110',
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111112',
    '11111111-1111-1111-1111-111111111113',
    '11111111-1111-1111-1111-111111111114',
    '11111111-1111-1111-1111-111111111115',
    '11111111-1111-1111-1111-111111111116',
    '11111111-1111-1111-1111-111111111117'
);
