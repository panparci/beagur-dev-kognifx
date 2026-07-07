-- Hapus semua data bisnis & akun pengguna kecuali Admin Yayasan.
-- Admin app user: id 11111111-1111-1111-1111-111111111101 (email dari baris users).
-- Better Auth: simpan baris "user" yang email-nya sama dengan admin app user.
--
-- Tetap dipertahankan: roles, permissions, program_settings, rag_documents, jwks, goose migrations.
--
-- Jalankan: make cleanup-except-admin

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = '11111111-1111-1111-1111-111111111101'::uuid) THEN
    RAISE EXCEPTION 'Admin Yayasan (id %) tidak ditemukan. Batalkan cleanup.', '11111111-1111-1111-1111-111111111101';
  END IF;
END $$;

-- Transaksi & laporan
DELETE FROM ledger_entries;
DELETE FROM donations;
DELETE FROM monthly_reports;
DELETE FROM analytics_monthly_snapshots;
DELETE FROM admin_audit_logs;

-- AI & sesi aplikasi
DELETE FROM ai_chat_messages;
DELETE FROM ai_logs;
DELETE FROM user_sessions;

-- Profil guru & institusi (teacher_profiles RESTRICT institutions)
DELETE FROM teacher_profiles;
DELETE FROM institutions;

-- Peran non-admin
DELETE FROM user_roles
WHERE user_id <> '11111111-1111-1111-1111-111111111101'::uuid;

-- Better Auth: hapus token verifikasi & akun selain admin
DELETE FROM verification;

DELETE FROM "user" ba
WHERE NOT EXISTS (
  SELECT 1 FROM users app
  WHERE app.id = '11111111-1111-1111-1111-111111111101'::uuid
    AND LOWER(app.email) = LOWER(ba.email)
);

-- Akun aplikasi non-admin
DELETE FROM users
WHERE id <> '11111111-1111-1111-1111-111111111101'::uuid;

-- Pastikan admin siap login
UPDATE users
SET account_status = 'ACTIVE'
WHERE id = '11111111-1111-1111-1111-111111111101'::uuid;

INSERT INTO user_roles (user_id, role_id)
SELECT '11111111-1111-1111-1111-111111111101'::uuid, r.id
FROM roles r
WHERE r.code = 'ADMIN'
ON CONFLICT DO NOTHING;

COMMIT;
