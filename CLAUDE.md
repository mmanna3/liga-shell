# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Estructura del repo

Monorepo con tres subproyectos independientes:

- `liga-be/` — Backend ASP.NET Core C# + SQL Server. Solución `Liga.sln`.
- `liga-fe/` — Frontend web Vite + React 19 + TypeScript.
- `app-carnet-digital/` — App React Native + Expo (tiene su propio `CLAUDE.md`).
- `scripts/` — Scripts utilitarios compartidos.

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
