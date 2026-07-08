/**
 * Creates Better Auth accounts for demo personas (password: BeaGuru123!).
 * Run after: npm run auth:migrate
 */
import './loadEnv.js';
import { auth, pool } from './auth.js';

const DEMO_PASSWORD = 'BeaGuru123!';

const DEMO_EMAILS = [
  'beaguru07@gmail.com',
  'kepsek.sdn1@bea-guru.dev',
  'kepsek.smp2@bea-guru.dev',
  'kepsek.sma3@bea-guru.dev',
  'guru.a@bea-guru.dev',
  'guru.b@bea-guru.dev',
  'guru.c@bea-guru.dev',
  'donor@bea-guru.dev',
];

async function main() {
  for (const email of DEMO_EMAILS) {
    const row = await pool.query<{ name: string }>(
      'SELECT name FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1',
      [email],
    );
    const name = row.rows[0]?.name ?? email.split('@')[0];

    try {
      await auth.api.signUpEmail({
        body: { email, password: DEMO_PASSWORD, name },
      });
      console.log(`Created auth account: ${email}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.toLowerCase().includes('already') || message.toLowerCase().includes('exist')) {
        console.log(`Skipped (exists): ${email}`);
      } else {
        console.warn(`Failed ${email}: ${message}`);
      }
    }
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
