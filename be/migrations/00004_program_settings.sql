-- +goose Up
CREATE TABLE IF NOT EXISTS program_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER program_settings_set_updated_at
BEFORE UPDATE ON program_settings
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

INSERT INTO program_settings (key, value) VALUES (
    'terms',
    'Ini adalah Syarat dan Ketentuan resmi Yayasan Bea Guru Indonesia yang berlaku bagi penerima manfaat. Semua donasi akan disalurkan secara transparan 100% dan akuntabel tanpa potongan kepada guru yang terverifikasi.'
) ON CONFLICT (key) DO NOTHING;

-- +goose Down
DROP TABLE IF EXISTS program_settings;
