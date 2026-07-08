-- +goose Up
-- Use the foundation Google account as the canonical Admin Yayasan login.

-- +goose StatementBegin
DO $$
DECLARE
    admin_id UUID := '11111111-1111-1111-1111-111111111101'::uuid;
    target_email TEXT := 'beaguru07@gmail.com';
    conflicting_user_id UUID;
BEGIN
    SELECT id INTO conflicting_user_id
    FROM users
    WHERE LOWER(email) = LOWER(target_email)
      AND id <> admin_id
    LIMIT 1;

    IF conflicting_user_id IS NOT NULL THEN
        UPDATE users
        SET email = 'beaguru07+merged-' || LEFT(conflicting_user_id::text, 8) || '@gmail.com'
        WHERE id = conflicting_user_id;
    END IF;

    UPDATE users
    SET email = target_email,
        name = 'Bea Guru',
        account_status = 'ACTIVE'
    WHERE id = admin_id;

    INSERT INTO user_roles (user_id, role_id)
    SELECT admin_id, r.id
    FROM roles r
    WHERE r.code = 'ADMIN'
    ON CONFLICT DO NOTHING;
END $$;
-- +goose StatementEnd

-- +goose Down
UPDATE users
SET email = 'admin@bea-guru.dev',
    name = 'Admin Yayasan'
WHERE id = '11111111-1111-1111-1111-111111111101';
