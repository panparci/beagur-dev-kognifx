-- +goose Up
-- Guru demo publik di Sulawesi Barat (Mamuju) — untuk uji sinkron peta landing page.

INSERT INTO institutions (id, name, address, validator_user_id) VALUES
    (
        '22222222-2222-2222-2222-222222222204',
        'SDN 1 Mamuju',
        'Jl. Pendidikan No. 8, Mamuju, Sulawesi Barat',
        '11111111-1111-1111-1111-111111111104'
    )
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    address = EXCLUDED.address;

INSERT INTO users (id, email, name) VALUES
    ('11111111-1111-1111-1111-111111111118', 'guru.mamuju@bea-guru.dev', 'Ibu Hasnah Wulandari')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.code = 'TEACHER'
WHERE u.id = '11111111-1111-1111-1111-111111111118'
ON CONFLICT DO NOTHING;

INSERT INTO teacher_profiles (
    id, user_id, institution_id, full_name, photo_url, teaching_photo_url,
    job_title, years_of_service, age, monthly_salary, phone_number,
    bank_name, bank_account_number, total_received_count, total_received_amount,
    region, latitude, longitude, reason, status, is_published
) VALUES (
    '33333333-3333-3333-3333-333333333313',
    '11111111-1111-1111-1111-111111111118',
    '22222222-2222-2222-2222-222222222204',
    'Ibu Hasnah Wulandari',
    'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=600',
    'Guru Honorer Kelas Rendah',
    6,
    33,
    580000,
    '081210010010',
    'BRI',
    '100010010',
    4,
    2320000,
    'Sulawesi Barat — Mamuju',
    -2.6726,
    118.8860,
    'Saya mengajar di SDN 1 Mamuju dengan fasilitas terbatas. Bantuan Bea Guru membantu saya tetap fokus mendidik murid di Sulawesi Barat.',
    'APPROVED',
    TRUE
)
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    institution_id = EXCLUDED.institution_id,
    photo_url = EXCLUDED.photo_url,
    teaching_photo_url = EXCLUDED.teaching_photo_url,
    job_title = EXCLUDED.job_title,
    region = EXCLUDED.region,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    reason = EXCLUDED.reason,
    status = EXCLUDED.status,
    is_published = EXCLUDED.is_published;

-- +goose Down
DELETE FROM teacher_profiles WHERE id = '33333333-3333-3333-3333-333333333313';
DELETE FROM user_roles WHERE user_id = '11111111-1111-1111-1111-111111111118';
DELETE FROM users WHERE id = '11111111-1111-1111-1111-111111111118';
DELETE FROM institutions WHERE id = '22222222-2222-2222-2222-222222222204';
