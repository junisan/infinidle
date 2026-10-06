#!/usr/bin/env bash
# Genera los iconos PNG de la app instalable (public/icons/) a partir del logo, con Chrome headless.
# - icon-192/512: el logo tal cual, con las esquinas redondeadas y transparentes
# - maskable-512 (Android) y apple-touch-icon (iOS): cuadrado lleno, el sistema le pone la forma;
#   el ∞ se encoge para que quede dentro de la zona segura (círculo del 80 %)
set -euo pipefail
cd "$(dirname "$0")/.."
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
OUT="$PWD/public/icons"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$OUT"

INF='<path d="M32 32C27.5 25.5 23.5 22.5 19 22.5a9.5 9.5 0 0 0 0 19c4.5 0 8.5-3 13-9.5s8.5-9.5 13-9.5a9.5 9.5 0 0 1 0 19c-4.5 0-8.5-3-13-9.5Z" fill="none" stroke="#fff" stroke-width="5.5" stroke-linejoin="round"/>'
cat > "$TMP/any.html" <<EOF
<style>html,body{margin:0;background:transparent}svg{display:block;width:100vw;height:100vh}</style>
<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#1a9384"/>$INF</svg>
EOF
cat > "$TMP/full.html" <<EOF
<style>html,body{margin:0}svg{display:block;width:100vw;height:100vh}</style>
<svg viewBox="0 0 64 64"><rect width="64" height="64" fill="#1a9384"/><g transform="translate(32 32) scale(.8) translate(-32 -32)">$INF</g></svg>
EOF

# Chrome headless a veces no termina tras la captura: se lanza aparte y se cierra en cuanto existe el PNG.
# Siempre a 512: por debajo de cierto ancho Chrome no encoge la ventana y recorta; luego se reduce con sips.
render() { # página, tamaño, salida
  local profile="$TMP/profile-$3" file="$OUT/$3"
  rm -f "$file"
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --default-background-color=00000000 --user-data-dir="$profile" --window-size=512,512 \
    --screenshot="$file" "file://$TMP/$1.html" >/dev/null 2>&1 &
  local pid=$!
  for _ in $(seq 1 60); do
    [ -s "$file" ] && break
    sleep 0.5
  done
  sleep 0.5
  kill "$pid" 2>/dev/null || true
  wait "$pid" 2>/dev/null || true
  [ -s "$file" ] || { echo "No se generó $file" >&2; exit 1; }
  [ "$2" = 512 ] || sips -Z "$2" "$file" >/dev/null
}

render any 192 icon-192.png
render any 512 icon-512.png
render full 512 maskable-512.png
render full 180 apple-touch-icon.png
ls -la "$OUT"
