-- +goose Up
-- Idempotent repair for production DBs that missed partial migrations (e.g. failed deploy).

CREATE TABLE IF NOT EXISTS analytics_monthly_snapshots (
    month DATE PRIMARY KEY,
    donation_amount BIGINT,
    donation_count INT,
    donor_count INT,
    transfer_amount BIGINT,
    teachers_cumulative INT,
    source TEXT NOT NULL DEFAULT 'import',
    note TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- +goose StatementBegin
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'analytics_monthly_snapshots_set_updated_at'
    ) THEN
        CREATE TRIGGER analytics_monthly_snapshots_set_updated_at
        BEFORE UPDATE ON analytics_monthly_snapshots
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;
-- +goose StatementEnd

INSERT INTO permissions (code, name, description) VALUES
    ('analytics:read', 'Lihat Analitik', 'Melihat grafik analitik program yayasan.'),
    ('analytics:write', 'Impor Analitik', 'Mengimpor snapshot bulanan dari CSV atau OCR.')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN ('analytics:read', 'analytics:write')
WHERE r.code = 'ADMIN'
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL DEFAULT '',
    detail JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS admin_audit_logs_created_at_idx ON admin_audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_logs_actor_idx ON admin_audit_logs (actor_user_id, created_at DESC);

INSERT INTO permissions (code, name, description) VALUES
    ('audit:read', 'Lihat Log Admin', 'Melihat jejak aktivitas admin yayasan.')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code = 'audit:read'
WHERE r.code = 'ADMIN'
ON CONFLICT DO NOTHING;

-- +goose Down
SELECT 1;
