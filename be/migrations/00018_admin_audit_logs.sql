-- +goose Up
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
DROP TABLE IF EXISTS admin_audit_logs;

DELETE FROM role_permissions
WHERE permission_id IN (SELECT id FROM permissions WHERE code = 'audit:read');

DELETE FROM permissions WHERE code = 'audit:read';
