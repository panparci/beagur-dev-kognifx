#!/usr/bin/env bash
# Load test ringan — concurrent requests ke endpoint publik & portal.
set -euo pipefail

BASE="${BASE_URL:-http://localhost:8080}"
CONCURRENCY="${CONCURRENCY:-50}"
REQUESTS="${REQUESTS:-200}"

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

jar="$TMP/donor.txt"
curl -sf -c "$jar" -X POST "$BASE/api/v1/auth/dev-login" \
  -H 'Content-Type: application/json' \
  -d '{"role":"DONOR"}' >/dev/null 2>&1 || true

run_batch() {
  local name=$1
  local path=$2
  local auth=${3:-no}
  local ok=0 fail=0
  local total_ms=0
  local max_ms=0

  echo "[$name] $REQUESTS requests × concurrency $CONCURRENCY"

  for ((batch=0; batch<REQUESTS; batch+=CONCURRENCY)); do
    pids=()
    for ((i=0; i<CONCURRENCY && batch+i<REQUESTS; i++)); do
      (
        start=$(python3 -c 'import time; print(int(time.time()*1000))')
        if [[ "$auth" == "cookie" ]]; then
          code=$(curl -s -o /dev/null -w '%{http_code}' -b "$jar" "$BASE$path")
        else
          code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE$path")
        fi
        end=$(python3 -c 'import time; print(int(time.time()*1000))')
        ms=$((end - start))
        echo "$code $ms" > "$TMP/r-$batch-$i"
      ) &
      pids+=($!)
    done
    for pid in "${pids[@]}"; do wait "$pid" || true; done

    for f in "$TMP"/r-$batch-*; do
      [[ -f "$f" ]] || continue
      read -r code ms < "$f"
      total_ms=$((total_ms + ms))
      (( ms > max_ms )) && max_ms=$ms
      if [[ "$code" == "200" ]]; then ok=$((ok+1)); else fail=$((fail+1)); fi
    done
    rm -f "$TMP"/r-$batch-*
  done

  avg=$(( total_ms / REQUESTS ))
  echo "  OK: $ok | Fail: $fail | Avg: ${avg}ms | Max: ${max_ms}ms"
  echo
}

echo "=== Load Test ($BASE) ==="
echo "Target: $REQUESTS req/endpoint, concurrency $CONCURRENCY"
echo

run_batch "public/campaign" "/api/v1/public/campaign"
run_batch "public/teachers" "/api/v1/public/teachers"
run_batch "teachers/approved (donor)" "/api/v1/teachers/approved" cookie
run_batch "reports approved (donor)" "/api/v1/reports?approved=true" cookie
run_batch "healthz" "/healthz"

echo "=== Done ==="
