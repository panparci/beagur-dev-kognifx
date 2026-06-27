# Bea Guru API

Backend API untuk Bea Guru — PostgreSQL + Gin.

## Quick start (full stack)

```bash
# dari root monorepo
make setup          # docker postgres + migrate + build
make run-be         # terminal 1 — API :8080
make run-fe         # terminal 2 — FE :3000
```

## Stack

- Gin, pgx, goose, sqlc (configured)
- PostgreSQL 16 (Docker Compose di root)

## Commands

```bash
make run
make build
make test
make migrate-up
make migrate-status
```

## Endpoints

### Public

- `GET /healthz`
- `GET /readyz`
- `GET /api/v1/public/campaign` — statistik homepage (tanpa auth)
- `POST /api/v1/auth/dev-login` — `{ "role": "ADMIN" }` → set cookie session

### Authenticated (cookie `bea_guru_sid` atau header `X-User-*` dev)

- `GET /api/v1/me`
- `POST /api/v1/auth/logout`
- `GET|POST /api/v1/institutions`
- `GET /api/v1/validators`
- `GET|POST /api/v1/teachers`, `GET /api/v1/teachers/me`
- `GET /api/v1/teachers/pending-validation`, `POST /api/v1/teachers/:id/validate`
- `GET /api/v1/teachers/pending-approval`, `POST /api/v1/teachers/:id/approve`
- `GET /api/v1/teachers/approved`
- `GET|POST /api/v1/donations`, `GET /api/v1/donations/mine`
- `GET|POST /api/v1/reports`, `GET /api/v1/reports/mine`, `PATCH /api/v1/reports/:id/status`
- `GET /api/v1/campaign/progress`
- `GET|PUT /api/v1/settings/terms` — syarat & ketentuan program (admin)
- `GET /api/v1/ai/rag?q=&topK=` — pencarian RAG
- `GET /api/v1/ai/rag/all`
- `GET|POST|DELETE /api/v1/ai/memory` — riwayat chat AI per user
- `GET|POST /api/v1/ai/logs` — telemetri token AI

Dev auth: login via `POST /api/v1/auth/dev-login` (cookie HttpOnly). Header `X-User-*` masih didukung untuk curl.

## Local run

```bash
cp .env.example .env
docker compose up -d postgres   # dari root repo
make migrate-up
make run
```
