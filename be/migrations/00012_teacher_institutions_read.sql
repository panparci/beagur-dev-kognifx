-- +goose Up
-- Guru perlu daftar sekolah saat mengisi profil pendaftaran.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code = 'institutions:read'
WHERE r.code = 'TEACHER'
ON CONFLICT DO NOTHING;

-- +goose Down
DELETE FROM role_permissions rp
USING roles r, permissions p
WHERE rp.role_id = r.id
  AND rp.permission_id = p.id
  AND r.code = 'TEACHER'
  AND p.code = 'institutions:read';
