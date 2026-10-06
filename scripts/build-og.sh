#!/usr/bin/env bash
# Renderiza scripts/og/og.html a public/og.png (1200×630), la imagen de las previsualizaciones al compartir.
set -euo pipefail
cd "$(dirname "$0")/.."
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
PROFILE="$(mktemp -d)"
OUT="$PWD/public/og.png"
rm -f "$OUT"
# Chrome headless a veces no termina tras la captura: se lanza aparte y se cierra en cuanto existe el PNG
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
  --user-data-dir="$PROFILE" --window-size=1200,630 --virtual-time-budget=2000 \
  --screenshot="$OUT" "file://$PWD/scripts/og/og.html" >/dev/null 2>&1 &
PID=$!
for _ in $(seq 1 60); do
  [ -s "$OUT" ] && break
  sleep 0.5
done
sleep 0.5
kill "$PID" 2>/dev/null || true
wait "$PID" 2>/dev/null || true
rm -rf "$PROFILE"
[ -s "$OUT" ] || { echo "No se generó $OUT" >&2; exit 1; }
ls -la "$OUT"
