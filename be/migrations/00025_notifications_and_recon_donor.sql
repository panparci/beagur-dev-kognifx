-- +goose Up
ALTER TABLE bank_transaction_lines
    ADD COLUMN IF NOT EXISTS suggested_donor_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'INFO',
    title TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    link_tab TEXT NOT NULL DEFAULT '',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_notifications_user_idx
    ON user_notifications (user_id, is_read, created_at DESC);

-- +goose Down
DROP TABLE IF EXISTS user_notifications;
ALTER TABLE bank_transaction_lines DROP COLUMN IF EXISTS suggested_donor_user_id;
