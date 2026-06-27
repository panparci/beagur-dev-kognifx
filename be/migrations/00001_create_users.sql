-- +goose Up
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- +goose StatementBegin
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- +goose StatementEnd

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password_hash TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    email_verified_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON users (LOWER(email));
CREATE INDEX IF NOT EXISTS users_is_active_idx ON users (is_active);

CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    is_system BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (code = UPPER(code))
);

CREATE TRIGGER roles_set_updated_at
BEFORE UPDATE ON roles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER permissions_set_updated_at
BEFORE UPDATE ON permissions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

INSERT INTO roles (code, name, description) VALUES
    ('ADMIN', 'Admin Yayasan', 'Mengelola program, data guru, sekolah, donatur, laporan, dan penyaluran.'),
    ('TEACHER', 'Guru Penerima', 'Mengelola profil guru dan laporan kegiatan mengajar.'),
    ('DONOR', 'Donatur', 'Melihat guru penerima bantuan, berdonasi, dan membaca laporan.'),
    ('VALIDATOR', 'Validator Sekolah', 'Memvalidasi profil guru dan kelayakan dari institusinya.')
ON CONFLICT (code) DO NOTHING;

INSERT INTO permissions (code, name, description) VALUES
    ('overview:read', 'Lihat Gambaran Umum', 'Melihat ringkasan program Bea Guru.'),
    ('teachers:read', 'Lihat Guru', 'Melihat daftar dan detail guru.'),
    ('teachers:write', 'Kelola Guru', 'Membuat dan mengubah data guru.'),
    ('teachers:validate', 'Validasi Guru', 'Memvalidasi pengajuan guru dari sekolah.'),
    ('donations:read', 'Lihat Donasi', 'Melihat data donasi dan penyaluran.'),
    ('donations:write', 'Buat Donasi', 'Membuat transaksi donasi.'),
    ('reports:read', 'Lihat Laporan', 'Melihat laporan kegiatan guru.'),
    ('reports:write', 'Buat Laporan', 'Membuat laporan kegiatan guru.'),
    ('reports:approve', 'Setujui Laporan', 'Menyetujui atau menolak laporan guru.'),
    ('institutions:read', 'Lihat Institusi', 'Melihat data sekolah dan validator.'),
    ('institutions:write', 'Kelola Institusi', 'Membuat dan mengubah data sekolah dan validator.'),
    ('ledger:read', 'Lihat Ledger', 'Melihat buku besar transaksi dan penyaluran.'),
    ('settings:write', 'Kelola Pengaturan', 'Mengubah pengaturan program dan kebijakan.')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN ('overview:read', 'teachers:read', 'reports:read', 'donations:write')
WHERE r.code = 'DONOR'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN ('overview:read', 'teachers:read', 'teachers:write', 'reports:read', 'reports:write')
WHERE r.code = 'TEACHER'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN ('overview:read', 'teachers:read', 'teachers:validate', 'institutions:read')
WHERE r.code = 'VALIDATOR'
ON CONFLICT DO NOTHING;

-- +goose Down
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS users;
DROP FUNCTION IF EXISTS set_updated_at();
