#!/bin/bash
# run-e2e-fe.sh — Tests E2E del frontend web contra backend real.
#
# Levanta el backend con base de datos de prueba exclusiva para frontend
# (liga_e2e_fe_test), levanta el frontend apuntando a ese backend,
# ejecuta los tests Playwright y limpia todo al terminar.
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_PORT="${BACKEND_PORT:-5072}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
BACKEND_LOCAL="http://localhost:$BACKEND_PORT"
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  echo ""
  echo "Limpiando BD de test frontend..."
  curl -s -X POST "$BACKEND_LOCAL/api/e2e-fe/cleanup" | cat || true
  echo ""
  echo "Deteniendo procesos..."
  [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null || true
  [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null || true
  echo "Cleanup completado."
}
trap cleanup EXIT

echo "Liberando puertos $BACKEND_PORT y $FRONTEND_PORT si están ocupados..."
lsof -ti tcp:"$BACKEND_PORT" | xargs kill -9 2>/dev/null || true
lsof -ti tcp:"$FRONTEND_PORT" | xargs kill -9 2>/dev/null || true

echo "Levantando backend (E2ETest + BD liga_e2e_fe_test)..."
(cd "$ROOT" && ASPNETCORE_ENVIRONMENT=E2ETest ASPNETCORE_URLS="http://localhost:$BACKEND_PORT" ConnectionStrings__Default="Server=localhost;Database=liga_e2e_fe_test;User Id=sa;Password=Pas\$word!39;TrustServerCertificate=True;" E2E_SEED_ENABLED=true dotnet run --project liga-be/Api --no-launch-profile) &
BACKEND_PID=$!

echo "Esperando que el backend levante en puerto $BACKEND_PORT..."
until nc -z localhost "$BACKEND_PORT" 2>/dev/null; do sleep 2; done
sleep 3

echo "Backend listo. Sembrando BD de test frontend..."
SEED_STATUS=$(curl -s -o /tmp/e2e_fe_seed_response.txt -w "%{http_code}" -X POST "$BACKEND_LOCAL/api/e2e-fe/seed")
cat /tmp/e2e_fe_seed_response.txt
if [ "$SEED_STATUS" != "200" ]; then
  echo ""
  echo "Error en seed (HTTP $SEED_STATUS). Abortando."
  exit 1
fi
echo ""
echo "Seed completado."

echo ""
echo "Levantando frontend (apuntando a backend real)..."
(cd "$ROOT/liga-fe" && VITE_API_BASE_URL="$BACKEND_LOCAL" npm run dev) &
FRONTEND_PID=$!

echo "Esperando que el frontend levante en puerto $FRONTEND_PORT..."
until nc -z localhost "$FRONTEND_PORT" 2>/dev/null; do sleep 2; done
sleep 2

echo ""
echo "Ejecutando tests E2E de frontend..."
(cd "$ROOT/liga-fe" && NODE_PATH="$ROOT/liga-fe/node_modules" npx playwright test --config playwright.e2e-fe.config.ts)
