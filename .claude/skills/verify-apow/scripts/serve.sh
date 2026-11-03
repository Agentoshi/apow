#!/usr/bin/env bash
# Starts, checks, and stops the local servers this skill drives. Each runs in its own
# process group with a pidfile, so stop kills only what start launched.
# Usage: serve.sh start|status|stop <mini|dashboard|website|grind|all>
# State and logs: $APOW_VERIFY_DIR (default /tmp/apow-verify). Evidence is never touched here.
set -euo pipefail
cmd="${1:?start|status|stop}"; target="${2:?mini|dashboard|website|grind|all}"
repo="$(cd "$(dirname "$0")/../../../.." && pwd)"
state="${APOW_VERIFY_DIR:-/tmp/apow-verify}"
mkdir -p "$state/run"

port_of() { case "$1" in mini) echo 8791;; dashboard) echo 8792;; website) echo 8793;; grind) echo 8794;; esac; }
health_of() { case "$1" in mini) echo /api/health;; grind) echo /health;; *) echo /;; esac; }

launch() {
  local name="$1" port; port="$(port_of "$name")"
  case "$name" in
    mini)
      cd "$repo/apps/mini"
      test -f dist/index.html || { echo "FAIL apps/mini/dist missing; run npm run build first"; return 1; }
      mkdir -p "$state/mini-d1"
      npx wrangler d1 migrations apply DB --local --persist-to "$state/mini-d1" > "$state/run/mini-migrate.log" 2>&1
      exec npx wrangler dev --ip 127.0.0.1 --port "$port" --persist-to "$state/mini-d1" \
        --var ENVIRONMENT:development --var BASE_RPC_URL: ;;
    dashboard)
      test -f "$repo/apps/dashboard/out/index.html" || { echo "FAIL apps/dashboard/out missing; run npm run build first"; return 1; }
      exec python3 -m http.server "$port" --bind 127.0.0.1 --directory "$repo/apps/dashboard/out" ;;
    website)
      test -f "$repo/apps/website/out/index.html" || { echo "FAIL apps/website/out missing; run npm run build first"; return 1; }
      exec python3 -m http.server "$port" --bind 127.0.0.1 --directory "$repo/apps/website/out" ;;
    grind)
      cd "$repo/packages/grind/worker"
      mkdir -p "$state/grind-d1" "$state/grind-shim"
      npx wrangler d1 migrations apply ECONOMICS_DB --local --persist-to "$state/grind-d1" > "$state/run/grind-migrate.log" 2>&1
      # src/index.ts has named exports that workerd rejects; the shim re-exports only the handler.
      printf 'import worker from "%s/packages/grind/worker/src/index.ts";\nexport default worker;\n' "$repo" > "$state/grind-shim/entry.ts"
      exec npx wrangler dev "$state/grind-shim/entry.ts" --ip 127.0.0.1 --port "$port" --persist-to "$state/grind-d1" ;;
  esac
}

listening_pid() { lsof -nP -t -iTCP:"$1" -sTCP:LISTEN 2>/dev/null | head -1; }

status() {
  local name="$1" port pidfile pid code
  port="$(port_of "$name")"; pidfile="$state/run/$name.pid"
  pid="$(cat "$pidfile" 2>/dev/null || true)"
  if [ -z "$pid" ] || ! kill -0 "$pid" 2>/dev/null; then echo "DOWN $name (no live pid from this skill)"; return 1; fi
  code="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$port$(health_of "$name")" || true)"
  if [ "$code" = 200 ]; then echo "UP $name http://127.0.0.1:$port pgid=$pid"; else echo "STARTING $name http $code (log $state/run/$name.log)"; return 1; fi
}

start() {
  local name="$1" port other
  port="$(port_of "$name")"
  if status "$name" >/dev/null 2>&1; then status "$name"; return 0; fi
  other="$(listening_pid "$port" || true)"
  if [ -n "$other" ]; then echo "FAIL port $port is held by pid $other, which this skill did not start"; return 1; fi
  set -m
  ( launch "$name" ) > "$state/run/$name.log" 2>&1 < /dev/null &
  echo $! > "$state/run/$name.pid"
  set +m
  for _ in $(seq 1 90); do
    status "$name" >/dev/null 2>&1 && { status "$name"; return 0; }
    kill -0 "$(cat "$state/run/$name.pid")" 2>/dev/null || break
    sleep 1
  done
  echo "FAIL $name did not become healthy; tail of $state/run/$name.log:"; tail -20 "$state/run/$name.log"; return 1
}

stop() {
  local name="$1" pidfile pid
  pidfile="$state/run/$name.pid"; pid="$(cat "$pidfile" 2>/dev/null || true)"
  if [ -n "$pid" ]; then kill -TERM -- "-$pid" 2>/dev/null || true; fi
  rm -f "$pidfile"
  echo "STOPPED $name"
}

names="$target"; [ "$target" = all ] && names="mini dashboard website grind"
rc=0
for n in $names; do
  [ -n "$(port_of "$n")" ] || { echo "unknown target $n"; exit 2; }
  "$cmd" "$n" || rc=1
done
exit $rc
