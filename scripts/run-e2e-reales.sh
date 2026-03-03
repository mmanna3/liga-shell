#!/bin/bash
# run-e2e-reales.sh
# Tests E2E de app-carnet-digital contra el backend real (base de datos liga_e2e_test).
#
# Prerrequisitos:
#   - Docker con SQL Server corriendo (mismo que liga_dev)
#   - Emulador Android corriendo
#   - iTerm abierto con al menos una pestaña activa
#
# Uso (desde la raíz del repo o desde scripts/):
#   bash scripts/run-e2e-reales.sh
#   npm run e2e        (desde la raíz del repo)

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP_DIR="$ROOT/app-carnet-digital"

BACKEND_PORT=5072
BACKEND_LOCAL="http://localhost:$BACKEND_PORT"

# En el emulador Android, 10.0.2.2 apunta al localhost del host
BE_URL_ANDROID="http://10.0.2.2:$BACKEND_PORT"

iTermExec() {
  osascript <<EOF
  tell application "iTerm"
    tell current window
      create tab with default profile
      tell current session of current tab
        write text "$1"
      end tell
    end tell
  end tell
EOF
}

# ── Pestaña 1: backend en modo E2ETest ────────────────────────────────────────
iTermExec "cd '$ROOT' && ASPNETCORE_ENVIRONMENT=E2ETest E2E_SEED_ENABLED=true dotnet run --project liga-be/Api"

# ── Pestaña 2: Metro con URL del backend real ─────────────────────────────────
iTermExec "cd '$APP_DIR' && EXPO_PUBLIC_E2E_API_URL=$BE_URL_ANDROID LIGA_ID=edefi npm start"

# ── Pestaña 3: espera al backend → seed → tests → cleanup ────────────────────
iTermExec "bash '$ROOT/scripts/_run-e2e-tab3.sh'"

# Mover foco a la primera pestaña nueva (el backend)
osascript <<EOF
tell application "iTerm"
  tell current window
    select first tab
  end tell
end tell
EOF
