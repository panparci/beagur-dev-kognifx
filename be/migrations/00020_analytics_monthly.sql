-- +goose Up
-- Optional monthly overrides (CSV / OCR import). NULL column = use live DB aggregate.
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

CREATE TRIGGER analytics_monthly_snapshots_set_updated_at
BEFORE UPDATE ON analytics_monthly_snapshots
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

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

-- +goose Down
DELETE FROM role_permissions
WHERE permission_id IN (
    SELECT id FROM permissions WHERE code IN ('analytics:read', 'analytics:write')
);
DELETE FROM permissions WHERE code IN ('analytics:read', 'analytics:write');
DROP TABLE IF EXISTS analytics_monthly_snapshots;
