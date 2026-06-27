-- +goose Up
-- Dev seed aligned with FE mock personas.

INSERT INTO users (id, email, name) VALUES
    ('11111111-1111-1111-1111-111111111101', 'admin@foundation.org', 'Admin Yayasan'),
    ('11111111-1111-1111-1111-111111111102', 'teacher@school.edu', 'Ibu Guru Budi'),
    ('11111111-1111-1111-1111-111111111103', 'donor@example.com', 'Donatur Baik'),
    ('11111111-1111-1111-1111-111111111104', 'principal@school.edu', 'Bpk. Drs. Sutomo'),
    ('11111111-1111-1111-1111-111111111105', 'kepsek.b@sekolah.id', 'Ibu Dra. Hartini'),
    ('11111111-1111-1111-1111-111111111106', 'kepsek.c@sekolah.id', 'Bpk. Ir. Purnomo'),
    ('11111111-1111-1111-1111-111111111107', 'ani.teacher@school.edu', 'Ibu Ani')
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON (
    (u.email = 'admin@foundation.org' AND r.code = 'ADMIN') OR
    (u.email IN ('teacher@school.edu', 'ani.teacher@school.edu') AND r.code = 'TEACHER') OR
    (u.email = 'donor@example.com' AND r.code = 'DONOR') OR
    (u.email IN ('principal@school.edu', 'kepsek.b@sekolah.id', 'kepsek.c@sekolah.id') AND r.code = 'VALIDATOR')
)
ON CONFLICT DO NOTHING;

INSERT INTO institutions (id, name, address, validator_user_id) VALUES
    ('22222222-2222-2222-2222-222222222201', 'SDN 1 Harapan Bangsa', 'Jl. Pendidikan No. 1, Jakarta', '11111111-1111-1111-1111-111111111104'),
    ('22222222-2222-2222-2222-222222222202', 'SMP 2 Cita-Cita Luhur', 'Jl. Kebangsaan No. 2, Bandung', '11111111-1111-1111-1111-111111111105'),
    ('22222222-2222-2222-2222-222222222203', 'SMA 3 Tunas Muda', 'Jl. Merdeka No. 3, Surabaya', '11111111-1111-1111-1111-111111111106')
ON CONFLICT (id) DO NOTHING;

INSERT INTO teacher_profiles (
    id, user_id, institution_id, full_name, photo_url, teaching_photo_url,
    job_title, years_of_service, age, monthly_salary, phone_number,
    bank_name, bank_account_number, total_received_count, total_received_amount,
    region, reason, status, is_published
) VALUES
(
    '33333333-3333-3333-3333-333333333301',
    '11111111-1111-1111-1111-111111111102',
    '22222222-2222-2222-2222-222222222201',
    'Ibu Guru Budi',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&q=80&w=600',
    'Guru Honorer Matematika', 6, 32, 500000, '081234567890',
    'BCA', '1234567890', 11, 5500000, 'Jakarta',
    'Saya mengajar matematika sejak tahun 2020 dengan penghasilan rendah.',
    'APPROVED', TRUE
),
(
    '33333333-3333-3333-3333-333333333302',
    '11111111-1111-1111-1111-111111111107',
    '22222222-2222-2222-2222-222222222201',
    'Ibu Ani',
    'https://images.unsplash.com/photo-1580894732444-8febeb28a57b?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=600',
    'Guru Honorer IPS & Bahasa', 5, 28, 750000, '081233344455',
    'BCA', '9876543210', 8, 4000000, 'Jakarta',
    'Saya telah mengabdi lebih dari 5 tahun dengan upah minim.',
    'PENDING_VALIDATION', FALSE
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO donations (donor_user_id, teacher_profile_id, amount, type) VALUES
    ('11111111-1111-1111-1111-111111111103', '33333333-3333-3333-3333-333333333301', 500000, 'RECURRING'),
    ('11111111-1111-1111-1111-111111111103', '33333333-3333-3333-3333-333333333301', 250000, 'ONE_TIME');

INSERT INTO monthly_reports (teacher_user_id, photo_url, description, status, submitted_at) VALUES
    ('11111111-1111-1111-1111-111111111102',
     'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=600',
     'Laporan belajar IPS siswa kelas 3 bulan Juli 2026.',
     'APPROVED', NOW() - INTERVAL '30 days');

-- +goose Down
DELETE FROM monthly_reports;
DELETE FROM donations;
DELETE FROM teacher_profiles;
DELETE FROM institutions;
DELETE FROM user_roles WHERE user_id IN (
    '11111111-1111-1111-1111-111111111101',
    '11111111-1111-1111-1111-111111111102',
    '11111111-1111-1111-1111-111111111103',
    '11111111-1111-1111-1111-111111111104',
    '11111111-1111-1111-1111-111111111105',
    '11111111-1111-1111-1111-111111111106',
    '11111111-1111-1111-1111-111111111107'
);
DELETE FROM users WHERE id IN (
    '11111111-1111-1111-1111-111111111101',
    '11111111-1111-1111-1111-111111111102',
    '11111111-1111-1111-1111-111111111103',
    '11111111-1111-1111-1111-111111111104',
    '11111111-1111-1111-1111-111111111105',
    '11111111-1111-1111-1111-111111111106',
    '11111111-1111-1111-1111-111111111107'
);
