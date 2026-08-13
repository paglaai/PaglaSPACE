#!/usr/bin/env bash
# health-check.sh — curl the live site and assert every public page returns 200.
set -euo pipefail

SITE_URL="${SITE_URL:-https://www.paglaai.space}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Derive public pages from sitemap.xml (checked in), fall back to a core list.
if [[ -f "$ROOT/sitemap.xml" ]]; then
  PAGES="$(grep -o '<loc>[^<]*</loc>' "$ROOT/sitemap.xml" | sed 's#</\?loc>##g')"
else
  PAGES="$SITE_URL/"
fi

failures=0
count=0
while IFS= read -r url; do
  [[ -z "$url" ]] && continue
  count=$((count + 1))
  code="$(curl -s -L -o /dev/null -w '%{http_code}' --max-time 20 "$url" || echo 000)"
  if [[ "$code" != "200" ]]; then
    echo "FAIL $code $url"
    failures=$((failures + 1))
  else
    echo "OK   $code $url"
  fi
done <<< "$PAGES"

echo ""
echo "Checked $count URL(s); $failures failure(s)."
[[ "$failures" -eq 0 ]]
