#!/bin/bash
# _e2e-ejecutar-tests.sh — Núcleo de los tests E2E: espera al backend, siembra la BD,
# instala fotos de prueba en el emulador y ejecuta la suite Maestro.
#
# Usado desde _run-e2e-tab3.sh (ejecución local) y desde el workflow de CI.
#
# Variables de entorno (opcionales; si no se definen, se calculan desde la ubicación del script):
#   ROOT          Raíz del repo liga.
#   APP_DIR       Directorio de app-carnet-digital.
#   BACKEND_PORT  Puerto donde escucha el backend. Default: 5072.
set -e

ROOT="${ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
APP_DIR="${APP_DIR:-$ROOT/app-carnet-digital}"
BACKEND_PORT="${BACKEND_PORT:-5072}"
BACKEND_LOCAL="http://localhost:$BACKEND_PORT"

cleanup() {
  echo ""
  echo "Limpiando BD de test..."
  curl -s -X POST "$BACKEND_LOCAL/api/e2e/cleanup" | cat
  echo ""
  echo "Cleanup completado."
}
trap cleanup EXIT

echo "Esperando que el backend levante en puerto $BACKEND_PORT..."
until nc -z localhost "$BACKEND_PORT" 2>/dev/null; do sleep 2; done
# Esperar inicialización completa (el puerto abre antes de que la app esté lista)
sleep 3

echo "Backend listo. Sembrando BD de test..."
SEED_STATUS=$(curl -s -o /tmp/e2e_seed_response.txt -w "%{http_code}" -X POST "$BACKEND_LOCAL/api/e2e/seed")
cat /tmp/e2e_seed_response.txt
if [ "$SEED_STATUS" != "200" ]; then
  echo ""
  echo "Error en seed (HTTP $SEED_STATUS). Abortando."
  exit 1
fi
echo ""
echo "Seed completado."

echo ""
echo "Instalando fotos de test en emulador..."
adb push "$ROOT/e2e-app/foto-e2e.jpg" /sdcard/DCIM/foto-e2e-1.jpg
adb push "$ROOT/e2e-app/foto-e2e.jpg" /sdcard/DCIM/foto-e2e-2.jpg
adb push "$ROOT/e2e-app/foto-e2e.jpg" /sdcard/DCIM/foto-e2e-3.jpg
adb shell am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d file:///sdcard/DCIM/foto-e2e-1.jpg
adb shell am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d file:///sdcard/DCIM/foto-e2e-2.jpg
adb shell am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d file:///sdcard/DCIM/foto-e2e-3.jpg

echo ""
echo "Ejecutando tests E2E..."
maestro test --debug-output "$APP_DIR/e2e-debug" --format HTML --output "$APP_DIR/e2e-report.html" "$ROOT/e2e-app/"
