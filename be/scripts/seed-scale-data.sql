-- Scale test data: ~1000 guru, ~500 donatur, donasi & laporan.
-- Prefix email: scale-*@loadtest.local — aman dihapus dengan cleanup-scale-data.sql
-- Jalankan: psql "$DATABASE_URL" -f be/scripts/seed-scale-data.sql

BEGIN;

-- 500 donatur
INSERT INTO users (id, email, name, is_active)
SELECT
  ('b0000000-0000-4000-8000-' || lpad(to_hex(i), 12, '0'))::uuid,
  'scale-donor-' || i || '@loadtest.local',
  'Donatur Load ' || i,
  TRUE
FROM generate_series(1, 500) AS i
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.code = 'DONOR'
WHERE u.email LIKE 'scale-donor-%@loadtest.local'
ON CONFLICT DO NOTHING;

-- 1000 guru (user + profil)
INSERT INTO users (id, email, name, is_active)
SELECT
  ('c0000000-0000-4000-8000-' || lpad(to_hex(i), 12, '0'))::uuid,
  'scale-teacher-' || i || '@loadtest.local',
  'Guru Load ' || i,
  TRUE
FROM generate_series(1, 1000) AS i
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.code = 'TEACHER'
WHERE u.email LIKE 'scale-teacher-%@loadtest.local'
ON CONFLICT DO NOTHING;

INSERT INTO teacher_profiles (
  id, user_id, institution_id, full_name, photo_url, teaching_photo_url,
  job_title, years_of_service, monthly_salary, phone_number,
  bank_name, bank_account_number, region, latitude, longitude,
  reason, status, is_published
)
SELECT
  ('d0000000-0000-4000-8000-' || lpad(to_hex(i), 12, '0'))::uuid,
  ('c0000000-0000-4000-8000-' || lpad(to_hex(i), 12, '0'))::uuid,
  (ARRAY[
    '22222222-2222-2222-2222-222222222201'::uuid,
    '22222222-2222-2222-2222-222222222202'::uuid,
    '22222222-2222-2222-2222-222222222203'::uuid
  ])[1 + (i % 3)],
  'Guru Load ' || i,
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&q=80&w=600',
  'Guru Honorer',
  3 + (i % 15),
  500000 + (i % 20) * 25000,
  '0812' || lpad(i::text, 8, '0'),
  'BCA',
  '1000' || lpad(i::text, 8, '0'),
  CASE (i % 3)
    WHEN 0 THEN 'DKI Jakarta'
    WHEN 1 THEN 'Jawa Barat — Bandung'
    ELSE 'Jawa Timur — Surabaya'
  END,
  CASE (i % 3)
    WHEN 0 THEN -6.2088
    WHEN 1 THEN -6.9175
    ELSE -7.2575
  END,
  CASE (i % 3)
    WHEN 0 THEN 106.8456
    WHEN 1 THEN 107.6191
    ELSE 112.7521
  END,
  'Load test guru #' || i,
  CASE WHEN i % 5 = 0 THEN 'APPROVED'::application_status ELSE 'PENDING_VALIDATION'::application_status END,
  (i % 5 = 0)
FROM generate_series(1, 1000) AS i
ON CONFLICT (id) DO NOTHING;

-- ~2000 donasi
INSERT INTO donations (donor_user_id, teacher_profile_id, amount, type, created_at)
SELECT
  ('b0000000-0000-4000-8000-' || lpad(to_hex(((i - 1) % 500) + 1), 12, '0'))::uuid,
  ('d0000000-0000-4000-8000-' || lpad(to_hex(((i - 1) % 1000) + 1), 12, '0'))::uuid,
  100000 + (i % 10) * 50000,
  CASE WHEN i % 2 = 0 THEN 'RECURRING'::donation_type ELSE 'ONE_TIME'::donation_type END,
  NOW() - (i || ' hours')::interval
FROM generate_series(1, 2000) AS i;

-- ~1500 laporan bulanan
INSERT INTO monthly_reports (teacher_user_id, photo_url, description, status, submitted_at)
SELECT
  ('c0000000-0000-4000-8000-' || lpad(to_hex(((i - 1) % 1000) + 1), 12, '0'))::uuid,
  'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=600',
  'Laporan load test #' || i,
  CASE WHEN i % 3 = 0 THEN 'APPROVED'::report_status ELSE 'PENDING'::report_status END,
  NOW() - (i || ' days')::interval
FROM generate_series(1, 1500) AS i;

COMMIT;

SELECT
  (SELECT COUNT(*) FROM users WHERE email LIKE 'scale-%@loadtest.local') AS scale_users,
  (SELECT COUNT(*) FROM teacher_profiles tp JOIN users u ON u.id = tp.user_id WHERE u.email LIKE 'scale-teacher-%') AS scale_teachers,
  (SELECT COUNT(*) FROM donations d JOIN users u ON u.id = d.donor_user_id WHERE u.email LIKE 'scale-donor-%') AS scale_donations,
  (SELECT COUNT(*) FROM monthly_reports mr JOIN users u ON u.id = mr.teacher_user_id WHERE u.email LIKE 'scale-teacher-%') AS scale_reports;
