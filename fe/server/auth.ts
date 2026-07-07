import './loadEnv.js';
import { betterAuth } from 'better-auth';
import { bearer, jwt } from 'better-auth/plugins';
import pg from 'pg';
import { notifyAccountCreated } from './notifyAccountCreated.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for Better Auth');
}

const pool = new pg.Pool({ connectionString: databaseUrl });

async function ensureAppUser(email: string, name: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return;
  await pool.query(
    `INSERT INTO users (email, name, account_status)
     VALUES ($1, $2, 'NO_ROLE')
     ON CONFLICT (email) DO NOTHING`,
    [normalized, name.trim() || normalized.split('@')[0]],
  );
}

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const authBaseURL = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000';
const trustedOrigins = Array.from(
  new Set(
    [
      authBaseURL,
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ].filter((origin): origin is string => Boolean(origin)),
  ),
);

export const auth = betterAuth({
  database: pool,
  baseURL: authBaseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
  },
  ...(googleClientId && googleClientSecret
    ? {
        socialProviders: {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
            redirectURI: `${authBaseURL}/api/auth/callback/google`,
          },
        },
      }
    : {}),
  plugins: [
    jwt({
      jwt: {
        definePayload: ({ user }) => ({
          sub: user.id,
          email: user.email,
          name: user.name,
        }),
      },
    }),
    bearer(),
  ],
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          if (user.email) {
            await ensureAppUser(user.email, user.name ?? user.email);
            void notifyAccountCreated(user.email, user.name ?? user.email);
          }
        },
      },
    },
  },
});

export { pool };
