#!/bin/bash
# restaurar-bd-dev.sh
# Crea la base de datos liga_dev (si no existe) y aplica migraciones.
# Útil cuando la BD fue eliminada o hay errores de conexión (ej. tras tests E2E).
#
# Uso: bash scripts/restaurar-bd-dev.sh
# Requiere: Docker con SQL Server (liga-localhost) corriendo.

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "Creando liga_dev si no existe..."
dotnet run --project "$ROOT/scripts/crear-bd-liga/crear-bd.csproj"

echo ""
echo "Aplicando migraciones..."
cd "$ROOT/liga-be/Api"
dotnet ef database update --project "$ROOT/liga-be/Api"

echo ""
echo "Listo. La BD liga_dev está creada/actualizada."
echo "Ejecuta 'dotnet run --project liga-be/Api' para iniciar el backend."
