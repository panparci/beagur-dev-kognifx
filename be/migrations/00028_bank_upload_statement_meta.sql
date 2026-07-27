-- +goose Up
ALTER TABLE bank_statement_uploads
    ADD COLUMN IF NOT EXISTS period_start DATE,
    ADD COLUMN IF NOT EXISTS period_end DATE,
    ADD COLUMN IF NOT EXISTS balance_as_of DATE,
    ADD COLUMN IF NOT EXISTS latest_balance BIGINT;

-- +goose Down
ALTER TABLE bank_statement_uploads
    DROP COLUMN IF EXISTS latest_balance,
    DROP COLUMN IF EXISTS balance_as_of,
    DROP COLUMN IF EXISTS period_end,
    DROP COLUMN IF EXISTS period_start;
