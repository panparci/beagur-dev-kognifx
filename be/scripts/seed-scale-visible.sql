-- Set semua guru load-test tampil di landing/map (APPROVED + published).
-- Jalankan setelah seed-scale-data.sql jika ingin demo ribuan guru di UI publik.

UPDATE teacher_profiles tp
SET status = 'APPROVED'::application_status,
    is_published = TRUE,
    rejected_by = NULL
FROM users u
WHERE u.id = tp.user_id
  AND u.email LIKE 'scale-teacher-%@loadtest.local';

SELECT
  count(*) FILTER (WHERE is_published) AS guru_published,
  count(*) AS guru_scale_total
FROM teacher_profiles tp
JOIN users u ON u.id = tp.user_id
WHERE u.email LIKE 'scale-teacher-%@loadtest.local';
