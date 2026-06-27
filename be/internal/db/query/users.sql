-- name: GetUserByID :one
SELECT
    u.id,
    u.email,
    u.name,
    u.is_active,
    u.email_verified_at,
    u.last_login_at,
    u.created_at,
    u.updated_at,
    COALESCE(array_agg(DISTINCT r.code) FILTER (WHERE r.code IS NOT NULL), ARRAY[]::TEXT[]) AS roles,
    COALESCE(array_agg(DISTINCT p.code) FILTER (WHERE p.code IS NOT NULL), ARRAY[]::TEXT[]) AS permissions
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN roles r ON r.id = ur.role_id
LEFT JOIN role_permissions rp ON rp.role_id = r.id
LEFT JOIN permissions p ON p.id = rp.permission_id
WHERE u.id = $1 AND u.is_active = TRUE
GROUP BY u.id;

-- name: GetUserByEmail :one
SELECT
    u.id,
    u.email,
    u.name,
    u.is_active,
    u.email_verified_at,
    u.last_login_at,
    u.created_at,
    u.updated_at,
    COALESCE(array_agg(DISTINCT r.code) FILTER (WHERE r.code IS NOT NULL), ARRAY[]::TEXT[]) AS roles,
    COALESCE(array_agg(DISTINCT p.code) FILTER (WHERE p.code IS NOT NULL), ARRAY[]::TEXT[]) AS permissions
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN roles r ON r.id = ur.role_id
LEFT JOIN role_permissions rp ON rp.role_id = r.id
LEFT JOIN permissions p ON p.id = rp.permission_id
WHERE LOWER(u.email) = LOWER($1) AND u.is_active = TRUE
GROUP BY u.id;
