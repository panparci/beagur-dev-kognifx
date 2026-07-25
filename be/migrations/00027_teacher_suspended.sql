-- +goose Up
-- +goose NO TRANSACTION
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'SUSPENDED';

ALTER TABLE teacher_profiles
    ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS suspended_reason TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS suspended_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- +goose Down
-- +goose NO TRANSACTION
ALTER TABLE teacher_profiles
    DROP COLUMN IF EXISTS suspended_by_user_id,
    DROP COLUMN IF EXISTS suspended_reason,
    DROP COLUMN IF EXISTS suspended_at;
-- Postgres cannot easily drop enum values; leave SUSPENDED in type on down.
