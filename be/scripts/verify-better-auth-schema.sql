-- Verifies the Better Auth schema required by better-auth 1.6.22.
-- Usage:
--   psql "$DATABASE_URL" -f be/scripts/verify-better-auth-schema.sql

WITH required_tables(table_name) AS (
    VALUES
        ('user'),
        ('session'),
        ('account'),
        ('verification'),
        ('jwks')
),
missing_tables AS (
    SELECT rt.table_name
    FROM required_tables rt
    WHERE to_regclass('public.' || quote_ident(rt.table_name)) IS NULL
),
required_columns(table_name, column_name) AS (
    VALUES
        ('user', 'id'),
        ('user', 'name'),
        ('user', 'email'),
        ('user', 'emailVerified'),
        ('user', 'image'),
        ('user', 'createdAt'),
        ('user', 'updatedAt'),
        ('session', 'id'),
        ('session', 'expiresAt'),
        ('session', 'token'),
        ('session', 'createdAt'),
        ('session', 'updatedAt'),
        ('session', 'ipAddress'),
        ('session', 'userAgent'),
        ('session', 'userId'),
        ('account', 'id'),
        ('account', 'accountId'),
        ('account', 'providerId'),
        ('account', 'userId'),
        ('account', 'accessToken'),
        ('account', 'refreshToken'),
        ('account', 'idToken'),
        ('account', 'accessTokenExpiresAt'),
        ('account', 'refreshTokenExpiresAt'),
        ('account', 'scope'),
        ('account', 'password'),
        ('account', 'createdAt'),
        ('account', 'updatedAt'),
        ('verification', 'id'),
        ('verification', 'identifier'),
        ('verification', 'value'),
        ('verification', 'expiresAt'),
        ('verification', 'createdAt'),
        ('verification', 'updatedAt'),
        ('jwks', 'id'),
        ('jwks', 'publicKey'),
        ('jwks', 'privateKey'),
        ('jwks', 'createdAt'),
        ('jwks', 'expiresAt')
),
missing_columns AS (
    SELECT rc.table_name, rc.column_name
    FROM required_columns rc
    LEFT JOIN information_schema.columns c
        ON c.table_schema = 'public'
       AND c.table_name = rc.table_name
       AND c.column_name = rc.column_name
    WHERE c.column_name IS NULL
)
SELECT 'missing_table' AS issue, table_name AS object_name
FROM missing_tables
UNION ALL
SELECT 'missing_column' AS issue, table_name || '.' || column_name AS object_name
FROM missing_columns
ORDER BY issue, object_name;
