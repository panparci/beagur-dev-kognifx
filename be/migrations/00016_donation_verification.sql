-- +goose Up
CREATE TYPE donation_verification_status AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

ALTER TABLE donations
    ADD COLUMN IF NOT EXISTS verification_status donation_verification_status NOT NULL DEFAULT 'PENDING',
    ADD COLUMN IF NOT EXISTS proof_url TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS invoice_number TEXT NOT NULL DEFAULT '';

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT '';

UPDATE donations SET verification_status = 'VERIFIED' WHERE verification_status = 'PENDING';

-- +goose Down
ALTER TABLE donations
    DROP COLUMN IF EXISTS invoice_number,
    DROP COLUMN IF EXISTS proof_url,
    DROP COLUMN IF EXISTS verification_status;

ALTER TABLE users DROP COLUMN IF EXISTS phone;

DROP TYPE IF EXISTS donation_verification_status;
