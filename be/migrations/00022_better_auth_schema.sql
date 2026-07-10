-- +goose Up
-- Better Auth runtime schema for better-auth 1.6.22.
-- Keep this in Goose so production does not depend on ad-hoc `better-auth migrate`
-- runs or `npx auth@latest`.

CREATE TABLE IF NOT EXISTS "user" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
    image TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS session (
    id TEXT PRIMARY KEY,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    token TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS account (
    id TEXT PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMPTZ,
    "refreshTokenExpiresAt" TIMESTAMPTZ,
    scope TEXT,
    password TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS verification (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS jwks (
    id TEXT PRIMARY KEY,
    "publicKey" TEXT NOT NULL,
    "privateKey" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL,
    "expiresAt" TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS user_email_uidx ON "user" (email);
CREATE UNIQUE INDEX IF NOT EXISTS session_token_uidx ON session (token);
CREATE INDEX IF NOT EXISTS session_userId_idx ON session ("userId");
CREATE INDEX IF NOT EXISTS account_userId_idx ON account ("userId");
CREATE INDEX IF NOT EXISTS verification_identifier_idx ON verification (identifier);

-- +goose StatementBegin
DO $$
BEGIN
    ALTER TABLE "user" ADD COLUMN IF NOT EXISTS name TEXT;
    ALTER TABLE "user" ADD COLUMN IF NOT EXISTS email TEXT;
    ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN DEFAULT FALSE;
    ALTER TABLE "user" ADD COLUMN IF NOT EXISTS image TEXT;
    ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

    ALTER TABLE session ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMPTZ;
    ALTER TABLE session ADD COLUMN IF NOT EXISTS token TEXT;
    ALTER TABLE session ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE session ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE session ADD COLUMN IF NOT EXISTS "ipAddress" TEXT;
    ALTER TABLE session ADD COLUMN IF NOT EXISTS "userAgent" TEXT;
    ALTER TABLE session ADD COLUMN IF NOT EXISTS "userId" TEXT;

    ALTER TABLE account ADD COLUMN IF NOT EXISTS "accountId" TEXT;
    ALTER TABLE account ADD COLUMN IF NOT EXISTS "providerId" TEXT;
    ALTER TABLE account ADD COLUMN IF NOT EXISTS "userId" TEXT;
    ALTER TABLE account ADD COLUMN IF NOT EXISTS "accessToken" TEXT;
    ALTER TABLE account ADD COLUMN IF NOT EXISTS "refreshToken" TEXT;
    ALTER TABLE account ADD COLUMN IF NOT EXISTS "idToken" TEXT;
    ALTER TABLE account ADD COLUMN IF NOT EXISTS "accessTokenExpiresAt" TIMESTAMPTZ;
    ALTER TABLE account ADD COLUMN IF NOT EXISTS "refreshTokenExpiresAt" TIMESTAMPTZ;
    ALTER TABLE account ADD COLUMN IF NOT EXISTS scope TEXT;
    ALTER TABLE account ADD COLUMN IF NOT EXISTS password TEXT;
    ALTER TABLE account ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE account ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

    ALTER TABLE verification ADD COLUMN IF NOT EXISTS identifier TEXT;
    ALTER TABLE verification ADD COLUMN IF NOT EXISTS value TEXT;
    ALTER TABLE verification ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMPTZ;
    ALTER TABLE verification ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE verification ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

    ALTER TABLE jwks ADD COLUMN IF NOT EXISTS "publicKey" TEXT;
    ALTER TABLE jwks ADD COLUMN IF NOT EXISTS "privateKey" TEXT;
    ALTER TABLE jwks ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ;
    ALTER TABLE jwks ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMPTZ;
END $$;
-- +goose StatementEnd

-- +goose StatementBegin
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'session_userId_user_id_fkey'
          AND conrelid = 'session'::regclass
    ) THEN
        ALTER TABLE session
            ADD CONSTRAINT "session_userId_user_id_fkey"
            FOREIGN KEY ("userId") REFERENCES "user"(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'account_userId_user_id_fkey'
          AND conrelid = 'account'::regclass
    ) THEN
        ALTER TABLE account
            ADD CONSTRAINT "account_userId_user_id_fkey"
            FOREIGN KEY ("userId") REFERENCES "user"(id) ON DELETE CASCADE;
    END IF;
END $$;
-- +goose StatementEnd

-- +goose StatementBegin
DO $$
DECLARE
    column_has_nulls BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT 1 FROM "user" WHERE name IS NULL) INTO column_has_nulls;
    IF NOT column_has_nulls THEN ALTER TABLE "user" ALTER COLUMN name SET NOT NULL; END IF;
    SELECT EXISTS (SELECT 1 FROM "user" WHERE email IS NULL) INTO column_has_nulls;
    IF NOT column_has_nulls THEN ALTER TABLE "user" ALTER COLUMN email SET NOT NULL; END IF;
    SELECT EXISTS (SELECT 1 FROM "user" WHERE "emailVerified" IS NULL) INTO column_has_nulls;
    IF NOT column_has_nulls THEN ALTER TABLE "user" ALTER COLUMN "emailVerified" SET NOT NULL; END IF;
    SELECT EXISTS (SELECT 1 FROM "user" WHERE "createdAt" IS NULL) INTO column_has_nulls;
    IF NOT column_has_nulls THEN ALTER TABLE "user" ALTER COLUMN "createdAt" SET NOT NULL; END IF;
    SELECT EXISTS (SELECT 1 FROM "user" WHERE "updatedAt" IS NULL) INTO column_has_nulls;
    IF NOT column_has_nulls THEN ALTER TABLE "user" ALTER COLUMN "updatedAt" SET NOT NULL; END IF;

    SELECT EXISTS (SELECT 1 FROM session WHERE "expiresAt" IS NULL) INTO column_has_nulls;
    IF NOT column_has_nulls THEN ALTER TABLE session ALTER COLUMN "expiresAt" SET NOT NULL; END IF;
    SELECT EXISTS (SELECT 1 FROM session WHERE token IS NULL) INTO column_has_nulls;
    IF NOT column_has_nulls THEN ALTER TABLE session ALTER COLUMN token SET NOT NULL; END IF;
    SELECT EXISTS (SELECT 1 FROM session WHERE "createdAt" IS NULL) INTO column_has_nulls;
    IF NOT column_has_nulls THEN ALTER TABLE session ALTER COLUMN "createdAt" SET NOT NULL; END IF;
    SELECT EXISTS (SELECT 1 FROM session WHERE "updatedAt" IS NULL) INTO column_has_nulls;
    IF NOT column_has_nulls THEN ALTER TABLE session ALTER COLUMN "updatedAt" SET NOT NULL; END IF;
    SELECT EXISTS (SELECT 1 FROM session WHERE "userId" IS NULL) INTO column_has_nulls;
    IF NOT column_has_nulls THEN ALTER TABLE session ALTER COLUMN "userId" SET NOT NULL; END IF;

    SELECT EXISTS (SELECT 1 FROM account WHERE "accountId" IS NULL) INTO column_has_nulls;
    IF NOT column_has_nulls THEN ALTER TABLE account ALTER COLUMN "accountId" SET NOT NULL; END IF;
    SELECT EXISTS (SELECT 1 FROM account WHERE "providerId" IS NULL) INTO column_has_nulls;
    IF NOT column_has_nulls THEN ALTER TABLE account ALTER COLUMN "providerId" SET NOT NULL; END IF;
    SELECT EXISTS (SELECT 1 FROM account WHERE "userId" IS NULL) INTO column_has_nulls;
    IF NOT column_has_nulls THEN ALTER TABLE account ALTER COLUMN "userId" SET NOT NULL; END IF;
    SELECT EXISTS (SELECT 1 FROM account WHERE "createdAt" IS NULL) INTO column_has_nulls;
    IF NOT column_has_nulls THEN ALTER TABLE account ALTER COLUMN "createdAt" SET NOT NULL; END IF;
    SELECT EXISTS (SELECT 1 FROM account WHERE "updatedAt" IS NULL) INTO column_has_nulls;
    IF NOT column_has_nulls THEN ALTER TABLE account ALTER COLUMN "updatedAt" SET NOT NULL; END IF;

    SELECT EXISTS (SELECT 1 FROM verification WHERE identifier IS NULL) INTO column_has_nulls;
    IF NOT column_has_nulls THEN ALTER TABLE verification ALTER COLUMN identifier SET NOT NULL; END IF;
    SELECT EXISTS (SELECT 1 FROM verification WHERE value IS NULL) INTO column_has_nulls;
    IF NOT column_has_nulls THEN ALTER TABLE verification ALTER COLUMN value SET NOT NULL; END IF;
    SELECT EXISTS (SELECT 1 FROM verification WHERE "expiresAt" IS NULL) INTO column_has_nulls;
    IF NOT column_has_nulls THEN ALTER TABLE verification ALTER COLUMN "expiresAt" SET NOT NULL; END IF;
    SELECT EXISTS (SELECT 1 FROM verification WHERE "createdAt" IS NULL) INTO column_has_nulls;
    IF NOT column_has_nulls THEN ALTER TABLE verification ALTER COLUMN "createdAt" SET NOT NULL; END IF;
    SELECT EXISTS (SELECT 1 FROM verification WHERE "updatedAt" IS NULL) INTO column_has_nulls;
    IF NOT column_has_nulls THEN ALTER TABLE verification ALTER COLUMN "updatedAt" SET NOT NULL; END IF;

    SELECT EXISTS (SELECT 1 FROM jwks WHERE "publicKey" IS NULL) INTO column_has_nulls;
    IF NOT column_has_nulls THEN ALTER TABLE jwks ALTER COLUMN "publicKey" SET NOT NULL; END IF;
    SELECT EXISTS (SELECT 1 FROM jwks WHERE "privateKey" IS NULL) INTO column_has_nulls;
    IF NOT column_has_nulls THEN ALTER TABLE jwks ALTER COLUMN "privateKey" SET NOT NULL; END IF;
    SELECT EXISTS (SELECT 1 FROM jwks WHERE "createdAt" IS NULL) INTO column_has_nulls;
    IF NOT column_has_nulls THEN ALTER TABLE jwks ALTER COLUMN "createdAt" SET NOT NULL; END IF;
END $$;
-- +goose StatementEnd

-- +goose Down
-- Intentionally no-op. These tables hold production auth state and must not be
-- dropped by rollback.
SELECT 1;
