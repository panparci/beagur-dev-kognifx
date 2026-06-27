#!/usr/bin/env bash
# RBAC smoke test — dev only (APP_ENV=development, dev-login + header auth).
set -euo pipefail

BASE="${BASE_URL:-http://localhost:8080}"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

pass=0
fail=0
skip=0

login_role() {
  local role=$1
  local jar="$TMP/cookies-$role.txt"
  curl -sf -c "$jar" -X POST "$BASE/api/v1/auth/dev-login" \
    -H 'Content-Type: application/json' \
    -d "{\"role\":\"$role\"}" >/dev/null
  echo "$jar"
}

expect_code() {
  local label=$1
  local want=$2
  local got=$3
  if [[ "$got" == "$want" ]]; then
    echo "  OK   $label → HTTP $got"
    pass=$((pass + 1))
  else
    echo "  FAIL $label → expected $want, got $got"
    fail=$((fail + 1))
  fi
}

hit() {
  local method=$1 path=$2 jar=$3
  curl -s -o /dev/null -w '%{http_code}' -X "$method" "$BASE$path" -b "$jar"
}

hit_no_auth() {
  local method=$1 path=$2
  curl -s -o /dev/null -w '%{http_code}' -X "$method" "$BASE$path"
}

echo "=== RBAC Audit ($BASE) ==="
echo

# Public
echo "[Public]"
expect_code "GET /healthz" 200 "$(hit_no_auth GET /healthz)"
expect_code "GET /public/campaign" 200 "$(hit_no_auth GET /api/v1/public/campaign)"
expect_code "GET /public/teachers" 200 "$(hit_no_auth GET /api/v1/public/teachers)"
expect_code "GET /me (no auth)" 401 "$(hit_no_auth GET /api/v1/me)"
echo

for role in ADMIN TEACHER DONOR VALIDATOR; do
  echo "[$role]"
  jar=$(login_role "$role") || { echo "  SKIP dev-login failed (APP_ENV=production?)"; skip=$((skip+1)); continue; }

  case "$role" in
    ADMIN)
      expect_code "GET /ledger" 200 "$(hit GET /api/v1/ledger "$jar")"
      expect_code "GET /teachers/pending-approval" 200 "$(hit GET /api/v1/teachers/pending-approval "$jar")"
      expect_code "GET /donations (all)" 200 "$(hit GET /api/v1/donations "$jar")"
      expect_code "PUT /settings/terms" 200 "$(curl -s -o /dev/null -w '%{http_code}' -X PUT "$BASE/api/v1/settings/terms" -b "$jar" -H 'Content-Type: application/json' -d '{"value":"audit test"}')"
      ;;
    TEACHER)
      expect_code "GET /teachers/me" 200 "$(hit GET /api/v1/teachers/me "$jar")"
      expect_code "GET /institutions" 200 "$(hit GET /api/v1/institutions "$jar")"
      expect_code "GET /ledger (deny)" 403 "$(hit GET /api/v1/ledger "$jar")"
      expect_code "GET /teachers/pending-approval (deny)" 403 "$(hit GET /api/v1/teachers/pending-approval "$jar")"
      ;;
    DONOR)
      expect_code "GET /teachers/approved" 200 "$(hit GET /api/v1/teachers/approved "$jar")"
      expect_code "GET /reports?approved=true" 200 "$(hit GET '/api/v1/reports?approved=true' "$jar")"
      expect_code "GET /ledger (deny)" 403 "$(hit GET /api/v1/ledger "$jar")"
      expect_code "PUT /settings/terms (deny)" 403 "$(curl -s -o /dev/null -w '%{http_code}' -X PUT "$BASE/api/v1/settings/terms" -b "$jar" -H 'Content-Type: application/json' -d '{"value":"x"}')"
      ;;
    VALIDATOR)
      expect_code "GET /teachers/pending-validation" 200 "$(hit GET /api/v1/teachers/pending-validation "$jar")"
      expect_code "GET /institutions" 200 "$(hit GET /api/v1/institutions "$jar")"
      expect_code "GET /donations (deny)" 403 "$(hit GET /api/v1/donations "$jar")"
      expect_code "GET /teachers/pending-approval (deny)" 403 "$(hit GET /api/v1/teachers/pending-approval "$jar")"
      ;;
  esac
  echo
done

echo "=== RBAC Summary: $pass passed, $fail failed, $skip skipped ==="
[[ "$fail" -eq 0 ]]
