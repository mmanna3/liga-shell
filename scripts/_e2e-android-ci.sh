#!/bin/bash
# _e2e-android-ci.sh — Build del APK, instalación en el emulador y ejecución de
# los tests E2E en CI. Se llama como un único comando desde el workflow de GitHub
# Actions para que los `cd` persistan dentro del mismo proceso bash.
#
# Variables de entorno (opcionales; si no se definen, se calculan desde el script):
#   ROOT          Raíz del repo liga.
#   APP_DIR       Directorio de app-carnet-digital.
#   BACKEND_PORT  Puerto donde escucha el backend. Default: 5072.
set -e

ROOT="${ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
APP_DIR="${APP_DIR:-$ROOT/app-carnet-digital}"
BACKEND_PORT="${BACKEND_PORT:-5072}"

echo "Compilando APK debug..."
cd "$APP_DIR/android"
LIGA_ID=edefi EXPO_PUBLIC_E2E_API_URL="http://10.0.2.2:$BACKEND_PORT" ./gradlew assembleDebug --no-daemon

echo "Instalando APK en el emulador..."
adb install "$APP_DIR/android/app/build/outputs/apk/debug/app-debug.apk"

echo "Iniciando backend..."
cd "$ROOT"
ASPNETCORE_ENVIRONMENT=E2ETest E2E_SEED_ENABLED=true \
  dotnet run --project liga-be/Api --no-restore --no-build &

bash scripts/_e2e-ejecutar-tests.sh
