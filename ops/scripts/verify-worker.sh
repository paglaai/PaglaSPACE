#!/usr/bin/env bash
# verify-worker.sh — verify the PaglaAI Operations Worker's health endpoint.
set -euo pipefail

WORKER_URL="https://ops.aynaghor.workers.dev"
code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$WORKER_URL/api/health" || echo 000)"
echo "Operations Worker health → $code ($WORKER_URL/api/health)"
[[ "$code" == "200" ]]
