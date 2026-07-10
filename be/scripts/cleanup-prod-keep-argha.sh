#!/usr/bin/env bash
set -euo pipefail

if [[ "${CONFIRM_CLEANUP:-}" != "YES" ]]; then
  echo "Refusing cleanup. Re-run with CONFIRM_CLEANUP=YES."
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env.production}"
COMPOSE_FILE="${COMPOSE_FILE:-$ROOT_DIR/docker-compose.prod.yml}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE"
  exit 1
fi

dc() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

echo "Cleaning database while preserving Admin Yayasan and argha.jkk@gmail.com..."
dc exec -T postgres psql \
  -U "$(grep -E '^POSTGRES_USER=' "$ENV_FILE" | cut -d= -f2-)" \
  -d "$(grep -E '^POSTGRES_DB=' "$ENV_FILE" | cut -d= -f2-)" \
  -v ON_ERROR_STOP=1 \
  -f - < "$ROOT_DIR/be/scripts/cleanup-all-except-admin-and-argha.sql"

echo "Removing uploaded media files from api:/app/uploads..."
dc exec -T api sh -lc 'find /app/uploads -mindepth 1 -delete'

echo "Cleanup complete. Restarting app services..."
dc restart api auth web
