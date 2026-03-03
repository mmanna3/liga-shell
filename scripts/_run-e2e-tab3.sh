#!/bin/bash
# _run-e2e-tab3.sh — Ejecutado por run-e2e-reales.sh en la pestaña de tests.
# Instala la app en el emulador y delega los tests en _e2e-ejecutar-tests.sh.
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP_DIR="$ROOT/app-carnet-digital"
BACKEND_PORT=5072
BE_URL_ANDROID="http://10.0.2.2:$BACKEND_PORT"

echo "Instalando app en emulador Android..."
cd "$APP_DIR"
EXPO_PUBLIC_E2E_API_URL="$BE_URL_ANDROID" LIGA_ID=edefi npm run android

ROOT="$ROOT" APP_DIR="$APP_DIR" BACKEND_PORT="$BACKEND_PORT" bash "$ROOT/scripts/_e2e-ejecutar-tests.sh"
