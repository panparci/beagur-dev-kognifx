# Production runbook

## GitHub secrets (deploy workflow)

Required: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_DEPLOY_PATH`, `POSTGRES_*`, `DATABASE_URL`, `FRONTEND_URL`, `ALLOWED_ORIGINS`, `BETTER_AUTH_*`, `WEB_PORT`.

Email + internal hooks (recommended):

- `BREVO_API_KEY`, `EMAIL_FROM`, `EMAIL_FROM_NAME` — donation/receipt emails
- `INTERNAL_NOTIFY_SECRET` — shared by API + auth (account-created notify)

Optional: `OPENROUTER_*`, `AI_MODELS`, `GOOGLE_CLIENT_*`, `GHCR_USERNAME`, `GHCR_TOKEN`, `LOG_LEVEL`.

Media (recommended prod): `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL` — foto guru & laporan ke Cloudflare R2 (bukan base64 di Postgres).

## VPS layout

1. Clone repo to `VPS_DEPLOY_PATH`
2. Copy `.env.production.example` → `.env.production` (deploy workflow overwrites on each push)
3. `docker compose --env-file .env.production -f docker-compose.prod.yml up -d`

Persistent volumes:

- `bea_guru_pg_data` — Postgres
- `bea_guru_uploads` — donation proof files (`/app/uploads` in API container)

## Backup (daily cron example)

```bash
0 3 * * * cd /path/to/bea-guru && ENV_FILE=.env.production ./be/scripts/backup-prod.sh >> /var/log/bea-guru-backup.log 2>&1
```

Restore DB:

```bash
gunzip -c backups/db_YYYYMMDD_HHMMSS.sql.gz | docker compose --env-file .env.production -f docker-compose.prod.yml exec -T postgres psql -U bea_guru_app -d bea_guru
```

Restore uploads:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml exec -T api tar xzf - -C /app/uploads < backups/uploads_YYYYMMDD_HHMMSS.tar.gz
```

## Health monitoring

```bash
make prod-health
# or
BASE_URL=https://your-domain.com ./be/scripts/health-check-prod.sh
```

`GET /readyz` checks DB ping + upload directory writable.

## Local dev data reset

```bash
make cleanup-except-admin   # keeps admin@bea-guru.dev only
```
