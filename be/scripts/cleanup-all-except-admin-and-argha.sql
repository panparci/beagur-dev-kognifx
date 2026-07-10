-- Hard delete semua data bisnis + user, schema tetap utuh.
--
-- Dipertahankan:
-- - Admin Yayasan: beaguru07@gmail.com (id 11111111-1111-1111-1111-111111111101)
-- - Pak Arga: argha.jkk@gmail.com
-- - roles, permissions, program_settings, rag_documents, jwks, goose migrations

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = '11111111-1111-1111-1111-111111111101'::uuid) THEN
    RAISE EXCEPTION 'Admin Yayasan (id %) tidak ditemukan. Batalkan cleanup.', '11111111-1111-1111-1111-111111111101';
  END IF;
END $$;

DELETE FROM ledger_entries;
DELETE FROM donations;
DELETE FROM monthly_reports;
DELETE FROM analytics_monthly_snapshots;
DELETE FROM admin_audit_logs;
DELETE FROM ai_chat_messages;
DELETE FROM ai_logs;
DELETE FROM user_sessions;
DELETE FROM teacher_profiles;
DELETE FROM institutions;

WITH keep_users AS (
  SELECT id FROM users
  WHERE id = '11111111-1111-1111-1111-111111111101'::uuid
     OR LOWER(email) = 'argha.jkk@gmail.com'
)
DELETE FROM user_roles
WHERE user_id NOT IN (SELECT id FROM keep_users);

DELETE FROM verification;
DELETE FROM session;
DELETE FROM account
WHERE "userId" NOT IN (
  SELECT ba.id FROM "user" ba
  WHERE LOWER(ba.email) IN ('beaguru07@gmail.com', 'argha.jkk@gmail.com')
);

DELETE FROM "user" ba
WHERE LOWER(ba.email) NOT IN ('beaguru07@gmail.com', 'argha.jkk@gmail.com');

DELETE FROM users
WHERE id <> '11111111-1111-1111-1111-111111111101'::uuid
  AND LOWER(email) <> 'argha.jkk@gmail.com';

UPDATE users
SET account_status = 'ACTIVE',
    is_active = TRUE
WHERE id = '11111111-1111-1111-1111-111111111101'::uuid;

INSERT INTO user_roles (user_id, role_id)
SELECT '11111111-1111-1111-1111-111111111101'::uuid, r.id
FROM roles r
WHERE r.code = 'ADMIN'
ON CONFLICT DO NOTHING;

COMMIT;
