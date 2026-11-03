#!/usr/bin/env bash
# Headless Chrome capture of a local URL: a PNG screenshot plus the rendered DOM text.
# Usage: shot.sh <url> <out-prefix> [WxH]
#   writes <out-prefix>.png and <out-prefix>.dom.html, then prints the DOM size.
set -euo pipefail
url="$1"; out="$2"; size="${3:-1280,900}"
chrome="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
profile="$(mktemp -d /tmp/apow-verify-chrome.XXXXXX)"
trap 'rm -rf "$profile"' EXIT
mkdir -p "$(dirname "$out")"
flags=(--headless=new --disable-gpu --no-first-run --no-default-browser-check
  --user-data-dir="$profile" --window-size="$size" --virtual-time-budget=15000)
"$chrome" "${flags[@]}" --screenshot="$out.png" "$url" >/dev/null 2>&1
"$chrome" "${flags[@]}" --dump-dom "$url" 2>/dev/null > "$out.dom.html"
test -s "$out.png" || { echo "FAIL no screenshot at $out.png"; exit 1; }
test -s "$out.dom.html" || { echo "FAIL empty DOM at $out.dom.html"; exit 1; }
echo "PASS $out.png ($(wc -c < "$out.png") bytes), $out.dom.html ($(wc -c < "$out.dom.html") bytes)"
