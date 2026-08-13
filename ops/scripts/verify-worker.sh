#!/usr/bin/env bash
# verify-worker.sh — verify the Cloudflare Worker's health endpoint responds.
set -euo pipefail

WORKER_URL="${WORKER_URL:-}"
if [[ -z "$WORKER_URL" ]]; then
  echo "SKIP: WORKER_URL not set (set it in GitHub secrets/Cloudflare vars)."
  exit 0
fi

code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$WORKER_URL/api/health" || echo 000)"
echo "Worker health → $code ($WORKER_URL/api/health)"
[[ "$code" == "200" ]]
