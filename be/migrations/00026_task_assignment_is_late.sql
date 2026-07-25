-- +goose Up
ALTER TABLE task_assignments
    ADD COLUMN IF NOT EXISTS is_late BOOLEAN NOT NULL DEFAULT FALSE;

-- +goose Down
ALTER TABLE task_assignments DROP COLUMN IF EXISTS is_late;
