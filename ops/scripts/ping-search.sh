#!/usr/bin/env bash
# ping-search.sh — ping Google and Bing with the current sitemap URL.
set -euo pipefail

SITE_URL="${SITE_URL:-https://www.paglaai.space}"
SITEMAP_URL="${SITEMAP_URL:-$SITE_URL/sitemap.xml}"

ping() {
  local name="$1" endpoint="$2"
  local code
  code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 "$endpoint" || echo 000)"
  echo "$name → $code ($endpoint)"
}

# Both endpoints accept the sitemap as a plain query parameter; curl encodes it.
ping "Google" "https://www.google.com/ping?sitemap=$SITEMAP_URL"
ping "Bing"   "https://www.bing.com/ping?sitemap=$SITEMAP_URL"

echo ""
echo "Pinged search engines with $SITEMAP_URL."
