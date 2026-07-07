#!/usr/bin/env bash
# Smoke-check production stack via nginx / health endpoints.
set -euo pipefail

BASE_URL=${BASE_URL:-http://localhost}

health=$(curl -sf "$BASE_URL/healthz")
ready=$(curl -sf "$BASE_URL/readyz")

echo "$health" | grep -q '"status":"ok"' || {
  echo "healthz failed: $health"
  exit 1
}
echo "$ready" | grep -q '"status":"ready"' || {
  echo "readyz failed: $ready"
  exit 1
}

echo "prod health ok ($BASE_URL)"
