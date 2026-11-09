# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Estructura del repo

Esta carpeta es el repo `mmanna3/liga-shell` (público). Cada subproyecto es **su propio repo de GitHub**, clonado adentro e ignorado en `.gitignore`. Los commits y PRs se hacen en el repo de cada subcarpeta:

- `liga-be/` → `mmanna3/liga-be` — Backend ASP.NET Core C# + SQL Server. Solución `Liga.sln`.
- `liga-fe/` → `mmanna3/liga-fe` — Frontend web Vite + React 19 + TypeScript.
- `app-carnet-digital/` → `mmanna3/app-carnet-digital` — App React Native + Expo (tiene su propio `CLAUDE.md`).
- `liga-web-publica/` → `mmanna3/liga-web-publica`.

Lo que vive en `liga-shell`:

- `scripts/` — Scripts utilitarios compartidos.
- `e2e-fe/` — Specs Playwright del front contra el back real (`scripts/run-e2e-fe.sh`).
- `e2e-app/` — Flujos Maestro de la app contra el back real.
- `.github/workflows/` — `e2e.yml` y `backup.yml` (ver abajo).

---

## CI, deploy y PRs entre repos

**Mergear a `main` en liga-be o liga-fe deploya a producción.** La app se deploya a mano.

| Repo | En cada PR | Al pushear a `main` |
| --- | --- | --- |
| liga-be | `tests-pr.yml`: build y tests (check obligatorio "Build y tests") | `deploy.yml`: build, tests, migraciones y deploy a IIS |
| liga-fe | `chequeos-pr.yml`: lint, Prettier, `tsc` + build, Vitest y E2E con mock (no obligatorio) | `gh-pages.yml`: build y E2E; si pasan, deploy por FTP |
| app-carnet-digital | `ci.yml`: validaciones estáticas (obligatorio); los E2E con Maestro solo si el PR tiene el label `e2e` | `ci.yml` con E2E |
| liga-shell | `e2e.yml` en cada push a cualquier rama | `e2e.yml` (también todos los días) y `backup.yml` (backup diario de producción a Google Drive) |

- **Revisión:** en liga-be, liga-fe y app-carnet-digital, `CODEOWNERS` pide la aprobación de `mmanna3` para mergear a `main`. Un PR abierto por `mmanna3` no se puede autoaprobar: se mergea con `gh pr merge <n> --admin` (la regla no aplica a admins). liga-shell no tiene protección.
- **AppVeyor está obsoleto:** todo corre en GitHub Actions.
- **Runners:** los jobs que instalan Playwright están fijados en `ubuntu-24.04`, porque Playwright 1.58.2 no soporta Ubuntu 26.04 (el `ubuntu-latest` actual). Si se agrega un job con Playwright, usar lo mismo o actualizar Playwright.
- **Workflows deshabilitados por inactividad:** GitHub deshabilita los workflows programados de liga-shell tras 60 días sin actividad en el repo. Ya pasó una vez y el backup diario estuvo frenado tres meses. Revisar con `gh workflow list --repo mmanna3/liga-shell --all` y reactivar con `gh workflow enable`.

### E2E contra el back real (liga-shell)

- `e2e.yml` baja el `main` de liga-be y de liga-fe. Por eso un PR de liga-shell que depende de un cambio en el back o el front se mergea **después** del PR de ese repo. Una vez mergeado el otro PR, volver a correr el job del PR de liga-shell para que tome el `main` nuevo.
- Los datos salen de dos seeds en liga-be, que solo responden si `E2E_SEED_ENABLED=true`:
  - `E2ESeedController` (`/api/e2e`): para `e2e-app`.
  - `E2ESeedFeController` (`/api/e2e-fe`): para `e2e-fe`. Su usuario `admin` tiene control total en todos los módulos.
- Los flujos de Maestro usan ids fijos (`carnet-jugador-3`, `item-equipo-1`, etc.) que dependen del orden de creación en el seed. Agregar datos nuevos **al final** para no correr los ids.

### Requerimientos

Los requerimientos para implementar se escriben en `docs/requerimientos/` del repo que corresponde (por ejemplo `app-carnet-digital/docs/requerimientos/`, `liga-be/docs/requerimientos/`).

---

## liga-be (Backend ASP.NET Core)

### Comandos

```bash
# Desde la raíz del repo
dotnet run --project liga-be/Api                         # Servidor en puerto 5072
dotnet build liga-be/Liga.sln                            # Compilar todo
dotnet test liga-be/Liga.sln                             # Todos los tests

# Tests individuales por proyecto
dotnet test liga-be/Api.TestsDeIntegracion/
dotnet test liga-be/Api.TestsUnitarios/

# Migraciones (desde liga-be/Api/)
dotnet ef migrations add <Nombre> --project liga-be/Api
dotnet ef database update --project liga-be/Api
```

**Dev:** Requiere SQL Server con conexión configurada en `appsettings.Development.json` → `liga_dev`.

### Arquitectura

**Clean Architecture en capas:**

```
Controllers → Core (interfaces) → Persistencia (implementaciones) → SQL Server
```

- `Api/Api/Controllers/` — Controladores HTTP
- `Api/Core/` — Lógica de negocio e interfaces:
  - `Logica/` — Implementación de lógica (e.g. `JugadorCore`, `ClubCore`)
  - `Repositorios/` — Interfaces de repositorios (`IRepositorioABM<T>`, `IBDVirtual`)
  - `Entidades/` — Entidades de dominio (extienden `Entidad`)
  - `DTOs/` — Data Transfer Objects
  - `Servicios/` — Interfaces de servicios (e.g. `IAuthService`)
- `Api/Persistencia/` — Repositorios con EF Core + `AppDbContext`
- `Api/_Config/` — DI, AutoMapper, configuración JWT

**Repositorio genérico:** `IRepositorioABM<T>` define `Listar`, `Crear`, `ObtenerPorId`, `Modificar`. `IBDVirtual` abstrae `GuardarCambios()`.

### Flujo completo ABM (crear entidad nueva)

Para crear un flujo ABM completo de una entidad, seguir estos pasos:

1. **Entidad** en `Api/Core/Entidades/` (extiende `Entidad`)
2. **DTO** en `Api/Core/DTOs/` (extiende `DTO`)
3. **Interface del repositorio** en `Api/Core/Repositorios/` (ej: `IEntidadRepo : IRepositorioABM<Entidad>`)
4. **Repositorio** en `Api/Persistencia/Repositorios/` (hereda de `RepositorioABM<Entidad>`)
5. **Interface del Core** en `Api/Core/Servicios/Interfaces/` (ej: `IEntidadCore : ICoreABM<EntidadDTO>`)
6. **Core** en `Api/Core/Servicios/` (hereda de `ABMCore<IEntidadRepo, Entidad, EntidadDTO>`)
7. **Controller** en `Api/Api/Controllers/` (hereda de `ABMController<EntidadDTO, IEntidadCore, EntidadDTO>`)
8. **Mapeos AutoMapper** en `Api/_Config/MapperConfig.cs` (`CreateMap<Entidad, EntidadDTO>()` y `ReverseMap` si aplica)
9. **Inyección de dependencias** en `Api/_Config/InyeccionDeDependenciasConfig.cs` (registrar Repo y Core)

Si la entidad tiene colecciones hijas que se crean/modifican en bloque (no por separado):

- Incluir la colección en el DTO con `Include` en el Set() del repositorio
- En `Crear` y `AntesDeModificar` del Core: construir el grafo de entidades (padre + hijos) y asignar FKs
- Para modificar: eliminar hijos existentes antes de agregar los nuevos

Ejemplo de referencia: `FixtureAlgoritmo`, `FixtureAlgoritmoCore`, `FixtureAlgoritmoRepo`, `FixtureAlgoritmoController`.

**Auth:** JWT Bearer. Clave en `AppSettings:Token` (`appsettings.json`).

**Tests de integración:** `CustomWebApplicationFactory<Program>`. Cada clase de test hereda de `TestBase`, que hace `EnsureDeleted` + `EnsureCreated` antes de cada suite. Usuario de prueba: `test` / `test123`.

**NSwag:** `liga-be/nswag.json` genera el contrato OpenAPI. Para regenerar el cliente del frontend, usar el script de `scripts/`.

---

## liga-fe (Frontend Web)

### Comandos

```bash
# Desde liga-fe/
npm run dev          # Servidor de desarrollo (localhost)
npm run dev:lan      # Con acceso desde LAN
npm run build        # Build de producción
npm run lint         # ESLint
npm run lint:fix     # ESLint con auto-fix
npm run format       # Prettier
npm run check:tsc    # Type check sin build
npm run e2e          # Tests E2E con Playwright
npm run e2e:ui       # Playwright en modo UI

# Agregar componentes shadcn
npx shadcn@canary add
```

**Env var obligatoria:** `VITE_API_BASE_URL` apunta a la API del backend.

### Arquitectura

**Stack:** Vite + React 19 + TypeScript, Tailwind CSS v4, shadcn/ui (Radix UI), TanStack Query v5, TanStack Table v8, Zustand v5, react-router-dom v7.

**Routing:** Configuración plana en `src/routes/mapa-rutas-componentes.tsx`. Constantes de rutas en `src/routes/rutas.ts`. Las rutas admin están protegidas por `<RequiereAutenticacion>`.

**API Layer:**
- `src/api/clients.ts` — Cliente NSwag **auto-generado**. NO editar.
- `src/api/api.ts` — Instancia singleton del cliente.
- `src/api/http-client-wrapper.ts` — Interceptor JWT: agrega `Authorization: Bearer`, redirige a `/login` en 401/403.

**Auth:** Zustand store en `src/hooks/use-auth.ts`. Token JWT persistido en localStorage.

**Path alias:** `@/` resuelve a `src/`.

**Dominio:** clubs → equipos → jugadores → torneos. También: delegados (login a la app móvil), reportes, fichaje (flujo público de registro de jugadores vía QR).

---

## scripts/

- `generar-contrato-be-en-fe.sh` — Compila el backend, genera `swagger.json` y regenera `liga-fe/src/api/clients.ts` con NSwag.
- `generar-contrato-be-en-app.sh` — Igual pero para `app-carnet-digital/app/api/clients.ts`.

Correr desde la raíz del repo o desde `scripts/`.

---

## app-carnet-digital

Ver `app-carnet-digital/CLAUDE.md` para comandos y arquitectura detallada.
