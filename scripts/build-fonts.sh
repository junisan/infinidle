#!/usr/bin/env bash
# Genera public/fonts/nunito-{600,900}.woff2: Nunito (OFL) recortada a un peso fijo y al alfabeto latino
# (ASCII + Latin-1 con ñ, tildes, ¿¡ «» + comillas, guiones y …). Unos 12 KB por peso frente a ~37 KB de la variable.
# Requiere fonttools y brotli:  python3 -m venv .venv && .venv/bin/pip install fonttools brotli
set -euo pipefail
cd "$(dirname "$0")/.."
FT="${FT:-.venv/bin}"
TMP="$(mktemp -d)"
UNICODES="U+0020-007E,U+00A0-00FF,U+2013-2014,U+2018-201D,U+2026,U+2212"

curl -sL -o "$TMP/nunito.ttf" "https://github.com/google/fonts/raw/main/ofl/nunito/Nunito%5Bwght%5D.ttf"
curl -sL -o public/fonts/OFL.txt "https://raw.githubusercontent.com/google/fonts/main/ofl/nunito/OFL.txt"
for w in 600 900; do
  "$FT/fonttools" varLib.instancer "$TMP/nunito.ttf" "wght=$w" -o "$TMP/n$w.ttf" -q
  "$FT/pyftsubset" "$TMP/n$w.ttf" --unicodes="$UNICODES" --layout-features=kern --flavor=woff2 \
    --output-file="public/fonts/nunito-$w.woff2"
done
ls -la public/fonts
