-- Hapus data load test (prefix scale-*@loadtest.local)
BEGIN;

DELETE FROM monthly_reports
WHERE teacher_user_id IN (SELECT id FROM users WHERE email LIKE 'scale-teacher-%@loadtest.local');

DELETE FROM donations
WHERE donor_user_id IN (SELECT id FROM users WHERE email LIKE 'scale-donor-%@loadtest.local');

DELETE FROM teacher_profiles
WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'scale-teacher-%@loadtest.local');

DELETE FROM user_roles
WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'scale-%@loadtest.local');

DELETE FROM users WHERE email LIKE 'scale-%@loadtest.local';

COMMIT;
