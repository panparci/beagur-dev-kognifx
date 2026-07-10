#!/usr/bin/env bash
set -euo pipefail

if [[ "${CONFIRM_CLEANUP:-}" != "YES" ]]; then
  echo "Refusing cleanup. Re-run with CONFIRM_CLEANUP=YES."
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env.production}"
COMPOSE_FILE="${COMPOSE_FILE:-$ROOT_DIR/docker-compose.prod.yml}"
SQL_FILE="$ROOT_DIR/be/scripts/cleanup-all-except-admin-and-argha.sql"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE"
  exit 1
fi

DATABASE_URL="$(grep -E '^DATABASE_URL=' "$ENV_FILE" | cut -d= -f2- | tr -d '\r' || true)"
if [[ -z "$DATABASE_URL" ]]; then
  echo "DATABASE_URL missing in $ENV_FILE"
  exit 1
fi

run_psql() {
  if command -v psql >/dev/null 2>&1; then
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 "$@"
    return
  fi
  docker run --rm -i \
    -e DATABASE_URL="$DATABASE_URL" \
    postgres:16-alpine \
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 "$@"
}

echo "Cleaning database (DATABASE_URL host: $(python3 - <<'PY'
import os, re
url = os.environ.get("DATABASE_URL", "")
m = re.search(r"@([^/?]+)", url)
print(m.group(1) if m else "?")
PY
)) while preserving beaguru07@gmail.com + argha.jkk@gmail.com..."

export DATABASE_URL
run_psql -f "$SQL_FILE"

if [[ -f "$COMPOSE_FILE" ]] && docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps api >/dev/null 2>&1; then
  echo "Removing uploaded media files from api:/app/uploads..."
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T api \
    sh -lc 'find /app/uploads -mindepth 1 -delete' || true
  echo "Restarting app services..."
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" restart api auth web || true
fi

echo "Cleanup complete."
