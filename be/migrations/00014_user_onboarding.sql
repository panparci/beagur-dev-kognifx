-- +goose Up
CREATE TYPE account_status AS ENUM ('NO_ROLE', 'PENDING_VERIFICATION', 'ACTIVE');

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS account_status account_status NOT NULL DEFAULT 'NO_ROLE';

UPDATE users u
SET account_status = 'ACTIVE'
WHERE EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id);

-- +goose Down
ALTER TABLE users DROP COLUMN IF EXISTS account_status;
DROP TYPE IF EXISTS account_status;
