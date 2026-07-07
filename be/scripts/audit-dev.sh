#!/usr/bin/env bash
# Dev stack smoke audit — API, auth, DB, R2/static, RBAC.
set -euo pipefail

API="${API_URL:-http://localhost:8080}"
AUTH="${AUTH_URL:-http://localhost:3001}"
FE="${FE_URL:-http://localhost:3000}"
R2="${R2_PUBLIC_BASE_URL:-}"

pass=0
fail=0
warn=0

ok()   { echo "  OK   $1"; pass=$((pass + 1)); }
bad()  { echo "  FAIL $1"; fail=$((fail + 1)); }
note() { echo "  WARN $1"; warn=$((warn + 1)); }

check_http() {
  local label=$1 url=$2 expect=$3
  local code body
  code=$(curl -s -o /tmp/audit-body.txt -w '%{http_code}' --max-time 10 "$url" || echo "000")
  body=$(cat /tmp/audit-body.txt 2>/dev/null || true)
  if [[ "$code" == "$expect" ]] || [[ -n "$expect" && "$body" == *"$expect"* ]]; then
    ok "$label (HTTP $code)"
  else
    bad "$label (HTTP $code) $body"
  fi
}

echo "=== Bea Guru dev audit ==="
echo "API=$API AUTH=$AUTH FE=$FE"
echo

# Load R2 from be/.env if unset
if [[ -z "$R2" && -f be/.env ]]; then
  R2=$(grep -E '^R2_PUBLIC_BASE_URL=' be/.env | cut -d= -f2- | tr -d '\r' || true)
fi

check_http "API healthz" "$API/healthz" "ok"
check_http "API readyz (DB+uploads)" "$API/readyz" "ready"
check_http "Auth healthz" "$AUTH/healthz" "ok"

SESSION=$(curl -s -o /tmp/audit-session.json -w '%{http_code}' --max-time 10 \
  "$AUTH/api/auth/get-session" || echo "000")
if [[ "$SESSION" == "200" ]]; then
  ok "Auth get-session (HTTP 200)"
elif [[ "$SESSION" == "500" ]]; then
  bad "Auth get-session 500 — BETTER_AUTH_SECRET mismatch? DELETE FROM jwks; restart auth"
else
  bad "Auth get-session (HTTP $SESSION)"
fi

# R2 CDN (optional — local /static fallback exists)
if [[ -n "$R2" ]]; then
  if curl -sfI --max-time 12 "$R2/static/maskot.gif" | head -1 | grep -q 200; then
    ok "R2 mascot GIF reachable"
  else
    note "R2 CDN timeout/unreachable — pakai fe/public/static/ fallback"
  fi
else
  note "R2_PUBLIC_BASE_URL kosong — static lokal saja"
fi

# Local static fallback
if [[ -f fe/public/static/maskot.gif ]]; then
  ok "Local static maskot.gif"
else
  note "fe/public/static/maskot.gif missing — jalankan: make sync-r2-static"
fi

# Auth sign-up smoke (unique email)
TS=$(date +%s)
SIGN=$(curl -s -o /tmp/audit-sign.json -w '%{http_code}' --max-time 10 \
  -X POST "$AUTH/api/auth/sign-up/email" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"audit-$TS@test.local\",\"password\":\"AuditTest123!\",\"name\":\"Audit\"}" || echo "000")
if [[ "$SIGN" == "200" || "$SIGN" == "201" ]]; then
  ok "Auth sign-up endpoint"
else
  bad "Auth sign-up (HTTP $SIGN) $(cat /tmp/audit-sign.json 2>/dev/null)"
fi

# Dev-login + /me (development only)
if curl -sf "$API/healthz" | grep -q '"time"'; then
  JAR=$(mktemp)
  CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 \
    -c "$JAR" -X POST "$API/api/v1/auth/dev-login" \
    -H 'Content-Type: application/json' -d '{"role":"ADMIN"}' || echo "000")
  if [[ "$CODE" == "200" ]]; then
    ME=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 -b "$JAR" "$API/api/v1/me" || echo "000")
    if [[ "$ME" == "200" ]]; then
      ok "Dev-login ADMIN + /api/v1/me"
    else
      bad "/api/v1/me after dev-login (HTTP $ME)"
    fi
  else
    note "dev-login HTTP $CODE (production mode? skip)"
  fi
  rm -f "$JAR"
fi

# FE dev server
FE_CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$FE/" || echo "000")
if [[ "$FE_CODE" == "200" ]]; then
  ok "Frontend dev server"
else
  note "Frontend not on $FE (HTTP $FE_CODE) — make run?"
fi

echo
echo "=== Summary: $pass passed, $fail failed, $warn warnings ==="
[[ "$fail" -eq 0 ]] || exit 1
