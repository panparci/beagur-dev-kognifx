-- +goose Up
CREATE TYPE ledger_entry_type AS ENUM ('IN', 'OUT');

CREATE TABLE IF NOT EXISTS ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_type ledger_entry_type NOT NULL,
    description TEXT NOT NULL,
    amount BIGINT NOT NULL CHECK (amount > 0),
    donation_id UUID REFERENCES donations(id) ON DELETE SET NULL,
    teacher_profile_id UUID REFERENCES teacher_profiles(id) ON DELETE SET NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ledger_entries_occurred_at_idx ON ledger_entries (occurred_at DESC);

INSERT INTO ledger_entries (entry_type, description, amount, teacher_profile_id, occurred_at) VALUES
    ('OUT', 'Penyaluran dana Bea Guru ke Ibu Guru Budi', 500000, '33333333-3333-3333-3333-333333333301', '2026-06-07'),
    ('IN', 'Donasi korporat PT. Bakti Bangsa', 5000000, NULL, '2026-06-05'),
    ('OUT', 'Subsidi peraga belajar SDN 1 Harapan Bangsa', 1250000, NULL, '2026-06-01'),
    ('OUT', 'Penyaluran bulanan guru penerima bantuan', 800000, NULL, '2026-05-25');

-- +goose Down
DROP TABLE IF EXISTS ledger_entries;
DROP TYPE IF EXISTS ledger_entry_type;
