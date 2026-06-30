#!/usr/bin/env bash
# Reproducible Vercel deploy for HumanVouch web.
#
# stellar-sdk 16's ESM build ships nested .pnpm vendored deps that Vercel's file
# tracer misses, so the serverless function 500s on a missing js-xdr file. We patch
# the prebuilt function with the COMPLETE stellar-sdk package before uploading.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> building (Vercel preset)…"
VERCEL=1 yarn build

echo "==> patching the serverless function with the full @stellar/stellar-sdk…"
SRC="$(cd ../../node_modules/@stellar/stellar-sdk && pwd)"
for FUNC in .vercel/output/functions/*.func; do
  DEST="$FUNC/node_modules/@stellar/stellar-sdk"
  if [ -d "$DEST" ]; then
    cp -rn "$SRC/." "$DEST/"
    echo "    patched $FUNC"
  fi
done

echo "==> deploying to production…"
npx --yes vercel deploy --prebuilt --prod --yes
