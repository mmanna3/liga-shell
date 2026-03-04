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

cleanup() {
  # Workaround: crashpad_handler no recibe señales al cerrar el emulador y provoca
  # "stop: Not implemented" + hang infinito. https://github.com/ReactiveCircus/android-emulator-runner/issues/385
  killall -INT crashpad_handler 2>/dev/null || true
}
trap cleanup EXIT

echo "Compilando APK release..."
chmod +x "$APP_DIR/android/gradlew"
cd "$APP_DIR/android"
LIGA_ID=edefi EXPO_PUBLIC_E2E_API_URL="http://10.0.2.2:$BACKEND_PORT" ./gradlew assembleRelease --no-daemon

echo "Instalando APK en el emulador..."
adb install -r "$APP_DIR/android/app/build/outputs/apk/release/app-release.apk"

cd "$ROOT"
if nc -z localhost "$BACKEND_PORT" 2>/dev/null; then
  echo "Backend corriendo."
else
  echo "Backend no disponible, reiniciando..."
  ASPNETCORE_ENVIRONMENT=E2ETest E2E_SEED_ENABLED=true \
    ASPNETCORE_URLS=http://localhost:$BACKEND_PORT \
    dotnet run --project liga-be/Api --no-restore --no-launch-profile &
fi

bash scripts/_e2e-ejecutar-tests.sh
