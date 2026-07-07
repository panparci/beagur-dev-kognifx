-- Better Auth JWKS encrypted with old BETTER_AUTH_SECRET → get-session 500.
-- Safe to rerun: auth regenerates keys on next request.
DELETE FROM jwks;
