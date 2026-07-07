-- +goose Up
ALTER TABLE donations
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS donations_invoice_number_unique_idx
    ON donations (invoice_number)
    WHERE invoice_number <> '';

INSERT INTO permissions (code, name, description) VALUES
    ('donors:read', 'Lihat Donatur', 'Melihat daftar dan profil donatur.'),
    ('donors:write', 'Kelola Donatur', 'Membuat dan mengubah data donatur.'),
    ('donations:verify', 'Verifikasi Donasi', 'Memverifikasi donasi dan membuat tagihan manual.')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN ('donors:read', 'donors:write', 'donations:verify')
WHERE r.code = 'ADMIN'
ON CONFLICT DO NOTHING;

-- +goose Down
DROP INDEX IF EXISTS donations_invoice_number_unique_idx;

ALTER TABLE donations
    DROP COLUMN IF EXISTS verified_by,
    DROP COLUMN IF EXISTS verified_at;

DELETE FROM role_permissions
WHERE permission_id IN (
    SELECT id FROM permissions WHERE code IN ('donors:read', 'donors:write', 'donations:verify')
);

DELETE FROM permissions WHERE code IN ('donors:read', 'donors:write', 'donations:verify');
