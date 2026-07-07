#!/usr/bin/env bash
# Backup Postgres + donation proof uploads from docker-compose.prod stack.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

ENV_FILE=${ENV_FILE:-.env.production}
COMPOSE="docker compose --env-file $ENV_FILE -f docker-compose.prod.yml"
BACKUP_DIR=${BACKUP_DIR:-./backups}
mkdir -p "$BACKUP_DIR"

STAMP=$(date +%Y%m%d_%H%M%S)
DB_FILE="$BACKUP_DIR/db_${STAMP}.sql"
UPLOAD_FILE="$BACKUP_DIR/uploads_${STAMP}.tar.gz"

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

echo "Backing up database..."
$COMPOSE exec -T postgres pg_dump \
  -U "${POSTGRES_USER:-bea_guru_app}" \
  -d "${POSTGRES_DB:-bea_guru}" \
  --no-owner > "$DB_FILE"
gzip -f "$DB_FILE"

echo "Backing up uploads..."
if $COMPOSE exec -T api test -d /app/uploads; then
  $COMPOSE exec -T api tar czf - -C /app/uploads . > "$UPLOAD_FILE"
else
  echo "warn: /app/uploads missing — skipping uploads archive"
fi

echo "Done:"
echo "  ${DB_FILE}.gz"
echo "  ${UPLOAD_FILE}"
