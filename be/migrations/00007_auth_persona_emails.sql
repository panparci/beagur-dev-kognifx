-- +goose Up
-- Persona emails for passwordless email login (dev clarity: Guru A/B/C + validator per sekolah)

UPDATE users SET email = 'admin@bea-guru.dev', name = 'Admin Yayasan'
WHERE id = '11111111-1111-1111-1111-111111111101';

UPDATE users SET email = 'guru.b@bea-guru.dev', name = 'Guru Budi (B) — SDN 1'
WHERE id = '11111111-1111-1111-1111-111111111102';

UPDATE users SET email = 'donor@bea-guru.dev', name = 'Donatur Baik'
WHERE id = '11111111-1111-1111-1111-111111111103';

UPDATE users SET email = 'kepsek.sdn1@bea-guru.dev', name = 'Kepala Sekolah SDN 1'
WHERE id = '11111111-1111-1111-1111-111111111104';

UPDATE users SET email = 'kepsek.smp2@bea-guru.dev', name = 'Kepala Sekolah SMP 2'
WHERE id = '11111111-1111-1111-1111-111111111105';

UPDATE users SET email = 'kepsek.sma3@bea-guru.dev', name = 'Kepala Sekolah SMA 3'
WHERE id = '11111111-1111-1111-1111-111111111106';

UPDATE users SET email = 'guru.a@bea-guru.dev', name = 'Guru Ani (A) — SDN 1'
WHERE id = '11111111-1111-1111-1111-111111111107';

INSERT INTO users (id, email, name) VALUES
    ('11111111-1111-1111-1111-111111111108', 'guru.c@bea-guru.dev', 'Guru Citra (C) — SMP 2')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name;

INSERT INTO user_roles (user_id, role_id)
SELECT '11111111-1111-1111-1111-111111111108'::uuid, r.id
FROM roles r WHERE r.code = 'TEACHER'
ON CONFLICT DO NOTHING;

INSERT INTO teacher_profiles (
    id, user_id, institution_id, full_name, photo_url, teaching_photo_url,
    job_title, years_of_service, age, monthly_salary, phone_number,
    bank_name, bank_account_number, total_received_count, total_received_amount,
    region, reason, status, is_published
) VALUES (
    '33333333-3333-3333-3333-333333333303',
    '11111111-1111-1111-1111-111111111108',
    '22222222-2222-2222-2222-222222222202',
    'Guru Citra (C)',
    'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=600',
    'Guru Honorer IPA', 4, 27, 680000, '081255566677',
    'Mandiri', '5555666777', 0, 0, 'Bandung',
    'Mengajar di SMP dengan gaji honorer di bawah standar.',
    'PENDING_VALIDATION', FALSE
)
ON CONFLICT (id) DO UPDATE SET
    institution_id = EXCLUDED.institution_id,
    status = EXCLUDED.status,
    full_name = EXCLUDED.full_name;

-- +goose Down
UPDATE users SET email = 'admin@foundation.org', name = 'Admin Yayasan'
WHERE id = '11111111-1111-1111-1111-111111111101';
UPDATE users SET email = 'teacher@school.edu', name = 'Ibu Guru Budi'
WHERE id = '11111111-1111-1111-1111-111111111102';
UPDATE users SET email = 'donor@example.com', name = 'Donatur Baik'
WHERE id = '11111111-1111-1111-1111-111111111103';
UPDATE users SET email = 'principal@school.edu', name = 'Bpk. Drs. Sutomo'
WHERE id = '11111111-1111-1111-1111-111111111104';
UPDATE users SET email = 'kepsek.b@sekolah.id', name = 'Ibu Dra. Hartini'
WHERE id = '11111111-1111-1111-1111-111111111105';
UPDATE users SET email = 'kepsek.c@sekolah.id', name = 'Bpk. Ir. Purnomo'
WHERE id = '11111111-1111-1111-1111-111111111106';
UPDATE users SET email = 'ani.teacher@school.edu', name = 'Ibu Ani'
WHERE id = '11111111-1111-1111-1111-111111111107';
DELETE FROM teacher_profiles WHERE id = '33333333-3333-3333-3333-333333333303';
DELETE FROM user_roles WHERE user_id = '11111111-1111-1111-1111-111111111108';
DELETE FROM users WHERE id = '11111111-1111-1111-1111-111111111108';
