# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Management-monitoring platform for a multi-branch retail company (Grupo Cordillera). The system is a **BFF + microservices** architecture: each microservice is an independent Quarkus 3 / Java 21 / Maven project with its own PostgreSQL database. Cross-service relationships are **logical, not real foreign keys** — reference another service's entity by an ID field (e.g. `sucursalRefId`), never a JPA `@ManyToOne` across service boundaries.

### Monorepo layout

Each top-level directory is a self-contained project (its own `pom.xml`, `mvnw`, `Dockerfile`). There is **no root aggregator POM** — build and run each service from its own directory. Only ms-auth and ms-users have `docker-compose.yml`; ms-datos and ms-kpis use standalone Docker containers (see port table below).

| Directory     | Role                         | Status                                                  |
|---------------|------------------------------|---------------------------------------------------------|
| `ms-users`    | User/role/branch domain      | **Fully implemented** — the reference for all patterns  |
| `ms-auth`     | Authentication & JWT         | **Fully implemented** — JWT HS384, BCrypt, refresh tokens |
| `ms-datos`    | Data ingestion               | Scaffold — implemented, requires manual DB container    |
| `ms-kpis`     | KPI computation              | Scaffold — implemented, requires RabbitMQ + seed data   |
| `ms-reportes` | Reporting                    | **Fully implemented** — puerto 8087, exportación PDF (OpenPDF) + Excel (Apache POI) |
| `bff`         | Backend-for-frontend         | **Fully implemented** — integra todos los microservicios |
| `front`       | Frontend React + Vite + TS   | **Fully implemented** — conectado al BFF, 8 vistas      |

Java package convention: `com.grupofrontera.ms<name>` (e.g. `com.grupofrontera.msusers`). `groupId` is `com.grupofrontera`. Note: `ms-users/contexto_ms_users.md` documents the original design but is **stale on two points** — the real package is `com.grupofrontera.*` (not `cl.duoc.cordillera`) and the Quarkus platform version in `pom.xml` is `3.36.0` (not 3.34.5). Trust the code/POM over that doc.

---

## Puertos — IMPORTANTE: conflictos en esta máquina

Esta máquina tiene servicios Windows que ocupan puertos por defecto. Los puertos fueron reasignados:

| Servicio    | Puerto HTTP | Puerto BD (host) | BD name        |
|-------------|-------------|------------------|----------------|
| `ms-auth`   | **8088**    | 5435             | db_auth        |
| `ms-users`  | **8085** ⚠️ | 5434             | db_users       |
| `ms-datos`  | **8089** ⚠️ | **5437** ⚠️      | grupofrontera  |
| `ms-kpis`   | **8086**    | 5438             | kpis_db        |
| `ms-reportes` | **8087**  | —                | —              |
| `bff`       | **8090**    | —                | —              |
| `front`     | **5173**    | —                | —              |

> **¿Por qué los puertos no-estándar?**
> - Puerto 8080: ocupado por **Jenkins** (`java`, PID fijo)
> - Puerto 8082: ocupado por **SSRS** (SQL Server Reporting Services, `RSHostingService`, HTTP.sys)
> - Puerto 5432: conflicto entre **PostgreSQL local** y Docker — pg-datos usa 5437

Los cambios ya están aplicados en los `application.properties` de cada servicio. No revertirlos.

---

## Commands

Run all commands from within a service directory (e.g. `cd ms-users`). Use the wrapper `./mvnw` (or `mvnw.cmd` on Windows).

```shell
./mvnw quarkus:dev            # Dev mode with live reload (Dev UI at /q/dev/)
./mvnw test                   # Run unit tests (@QuarkusTest)
./mvnw verify                 # Unit + integration tests (*IT, via failsafe; skipITs=true by default)
./mvnw package                # Build → target/quarkus-app/quarkus-run.jar
./mvnw package -Dnative       # Native executable (needs GraalVM, or add -Dquarkus.native.container-build=true)
java -jar target/quarkus-app/quarkus-run.jar
```

**ms-datos requiere flag extra** para evitar conflicto con Jenkins en el puerto de live-reload:
```shell
cd ms-datos
./mvnw quarkus:dev -Dquarkus.live-reload.port=8193
```

### Cómo levantar todo el stack (orden correcto)

```powershell
# 1. Contenedores Docker (si no están corriendo)
docker start pg-auth pg-users pg-datos pg-kpis rabbitmq
# Si es primera vez:
docker run -d --name pg-auth  -e POSTGRES_USER=usuario_cordillera -e POSTGRES_PASSWORD=cordillera_pass -e POSTGRES_DB=db_auth    -p 5435:5432 postgres:16
docker run -d --name pg-users -e POSTGRES_USER=usuario_cordillera -e POSTGRES_PASSWORD=cordillera_pass -e POSTGRES_DB=db_users   -p 5434:5432 postgres:16
docker run -d --name pg-datos -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=grupofrontera              -p 5437:5432 postgres:16
docker run -d --name pg-kpis  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=kpis_db                   -p 5438:5432 postgres:16
docker run -d --name rabbitmq -e RABBITMQ_DEFAULT_USER=guest -e RABBITMQ_DEFAULT_PASS=guest -p 5672:5672 -p 15672:15672 rabbitmq:3-management

# 2–6. Cada servicio en su propia terminal PowerShell
cd ms-auth   && .\mvnw.cmd quarkus:dev   # terminal 1
cd ms-users  && .\mvnw.cmd quarkus:dev   # terminal 2
cd ms-datos  && .\mvnw.cmd quarkus:dev -Dquarkus.live-reload.port=8193  # terminal 3
cd ms-kpis   && .\mvnw.cmd quarkus:dev   # terminal 4
cd bff       && .\mvnw.cmd quarkus:dev   # terminal 5
cd front     && npm run dev              # terminal 6

# 7. Registrar credenciales en ms-auth (solo si ms-auth se reinició — su import.sql está vacío)
curl -X POST http://localhost:8088/auth/register -H "Content-Type: application/json" -d "{\"usuarioId\":\"d1111111-1111-1111-1111-111111111111\",\"email\":\"admin@cordillera.cl\",\"password\":\"Admin1234!\"}"
curl -X POST http://localhost:8088/auth/register -H "Content-Type: application/json" -d "{\"usuarioId\":\"e2222222-2222-2222-2222-222222222222\",\"email\":\"soporte@cordillera.cl\",\"password\":\"Soporte1234!\"}"
curl -X POST http://localhost:8088/auth/register -H "Content-Type: application/json" -d "{\"usuarioId\":\"f3333333-3333-3333-3333-333333333333\",\"email\":\"gerente@cordillera.cl\",\"password\":\"Gerente1234!\"}"
```

---

## Architecture (ms-users — the template to follow)

Strict layered flow, one package per layer under `com.grupofrontera.msusers`:

```
Resource (JAX-RS REST)  →  Service (business logic)  →  Repository (Panache)  →  Entity (JPA)
                                                                              →  DTO (in/out)
```

Conventions enforced across the codebase (mirror these when adding code):

- **Resources** (`resource/`): `@Path`-annotated, `@Inject` the Service, contain **no business logic** — they only delegate. Return DTOs or `Response`. Use `Response.status(CREATED)` for POSTs.
- **Services** (`service/`): `@ApplicationScoped`. Methods that modify data are `@Transactional` (`jakarta.transaction.Transactional`). Each service owns explicit `toDTO()` / `fromDTO()` mapping methods and an `obtenerPorId()` that throws `NotFoundException`.
- **Repositories** (`repository/`): implement `PanacheRepositoryBase<Entity, UUID>`. Add named query helpers (e.g. `existePorRut`, `listarRolesPorUsuario`).
- **Entities** (`entity/`): extend `PanacheEntityBase`, `@Id @GeneratedValue(strategy = GenerationType.UUID)` with `public UUID id`. Public fields (Panache active-record style). Real FK `@ManyToOne` only **within the same service/database**.
- **DTOs** (`dto/`): never expose entities directly. Separate `*RequestDTO` / `*ResponseDTO`.
- **Errors**: throw `jakarta.ws.rs.NotFoundException` (404) or `WebApplicationException` with an explicit `Response.Status` (e.g. 409 for uniqueness violations). There is no global ExceptionMapper yet.
- **Soft delete**: `Usuario`/`Rol`/`Sucursal` use `estado`/`activo` flags rather than physical deletes; default list endpoints return only active records.
- **Bootstrap**: `CatalogoGeograficoBootstrap` seeds geographic catalog data idempotently via `@Observes StartupEvent`.

---

## Database notes

- ms-auth y ms-users usan `drop-and-create` + `import.sql` — el esquema **se destruye y recrea en cada arranque**. Solo para dev; cambiar a `update` antes de producción.
- ms-datos usa Flyway (`migrate-at-start=true`). ms-kpis también usa Flyway.
- Stack: PostgreSQL 16, Hibernate ORM + Panache, `quarkus-rest` + `quarkus-rest-jackson`, `quarkus-hibernate-validator`, `quarkus-smallrye-openapi`. Tests use `quarkus-junit5` + `rest-assured`.

### Credenciales semilla (ms-users import.sql)

ms-users siembra 3 usuarios. ms-auth tiene el import.sql **vacío** — las credenciales se registran via `POST /auth/register` tras cada restart:

| usuarioId (UUID prefix)    | Email                   | Password       | Rol     |
|----------------------------|-------------------------|----------------|---------|
| `d1111111-…`               | admin@cordillera.cl     | Admin1234!     | ADMIN   |
| `e2222222-…`               | soporte@cordillera.cl   | Soporte1234!   | SOPORTE |
| `f3333333-…`               | gerente@cordillera.cl   | Gerente1234!   | GERENTE |

---

## ms-auth — Authentication microservice

**Fully implemented.** Port **8088**, DB db_auth (port 5435). See `ms-auth/SETUP.md`.

### Endpoints

| Method | Path            | Description                                      |
|--------|-----------------|--------------------------------------------------|
| POST   | /auth/register  | Register credentials (called by BFF after user creation) |
| POST   | /auth/login     | Login → `accessToken` (JWT) + `refreshToken` (UUID) |
| POST   | /auth/refresh   | Rotate tokens — old RT invalidated, new pair returned |
| POST   | /auth/logout    | Invalidate refreshToken → HTTP 204              |
| POST   | /auth/validate  | Validate JWT via `Authorization: Bearer <token>` header |

### Key implementation details

- **JWT**: HS384, signed with `auth.jwt.secret` (Base64-encoded), 1h expiration. Claims: `sub=usuarioId`, `email`.
- **BCrypt**: via `quarkus-elytron-security-common` (`BcryptUtil.bcryptHash()` / `BcryptUtil.matches()`).
- **RefreshToken rotation**: each call to `/auth/refresh` marks the old token `invalidado=true` and issues a new pair.
- **Credencial entity**: stores `usuarioRefId` (logical FK to ms-users), `email`, `passwordHash`, `activo`.
- **RefreshToken entity**: `@ManyToOne Credencial` (within same DB — this is allowed), `token` (UUID string), `expiresAt` (7 days), `invalidado`.
- **Password architecture**: passwords live **exclusively in ms-auth**. ms-users has no password field. The BFF orchestrates user creation: `POST /usuarios` (ms-users) → take returned `id` → `POST /auth/register` (ms-auth).
- **Config properties**: `auth.jwt.secret`, `auth.jwt.expiration-hours=1`, `auth.jwt.refresh-expiration-days=7`.

### Integration flow (via BFF)

```
POST /api/bff/auth/login    → bff:8090 → ms-auth:8088  → returns { usuarioId, email, accessToken, refreshToken }
POST /api/bff/auth/refresh  → bff:8090 → ms-auth:8088
POST /api/bff/auth/logout   → bff:8090 → ms-auth:8088
```

---

## bff — Backend for Frontend

**Fully implemented.** Puerto **8090**. Agrega todos los microservicios con una sola API para el frontend.

### Endpoints BFF

| Method | Path                               | Upstream         |
|--------|------------------------------------|------------------|
| POST   | /api/bff/auth/login                | ms-auth          |
| POST   | /api/bff/auth/refresh              | ms-auth          |
| POST   | /api/bff/auth/logout               | ms-auth          |
| GET    | /api/bff/usuarios                  | ms-users         |
| GET    | /api/bff/usuarios/{id}             | ms-users         |
| POST   | /api/bff/usuarios                  | ms-users + ms-auth |
| PUT    | /api/bff/usuarios/{id}/activar     | ms-users         |
| PUT    | /api/bff/usuarios/{id}/desactivar  | ms-users         |
| GET    | /api/bff/sucursales                | ms-datos         |
| POST   | /api/bff/sucursales                | ms-datos         |
| PUT    | /api/bff/sucursales/{id}           | ms-datos         |
| PUT    | /api/bff/sucursales/{id}/estado    | ms-datos         |
| GET    | /api/bff/kpis                      | ms-kpis          |
| GET    | /api/bff/kpis/comparativo          | ms-kpis          |
| GET    | /api/bff/datos                     | ms-datos         |
| POST   | /api/bff/datos/{id}/reprocesar     | ms-datos         |
| GET    | /api/bff/reportes/exportar         | ms-reportes      |

### Detalles de implementación BFF

- **CORS**: habilitado para `http://localhost:5173`
- **Error propagation**: `ClientExceptionMapper` (`bff/src/main/java/com/grupofrontera/bff/exception/`) propaga códigos 4xx de los microservicios correctamente. `quarkus.rest-client.disable-default-mapper=true` en `application.properties`.
- **Sin seguridad interna**: el BFF no valida JWT — confía en que ms-auth valida. ms-users no tiene extensiones de seguridad.
- **Dos modelos de sucursal**: `/api/bff/sucursales` apunta a ms-datos (id: `Long`). ms-users tiene sus propias sucursales (id: `UUID`) — no expuestas en BFF.

---

## ms-kpis — KPI microservice

Puerto **8086**, BD kpis_db (puerto 5438). Requiere **RabbitMQ** corriendo en localhost:5672.

- Los KPIs se calculan a partir de eventos recibidos via RabbitMQ (`venta.realizada`, `actualizacion.stock`).
- En dev, el servicio arranca sin datos. Para tener datos de prueba insertar directamente:

```sql
-- docker exec -it pg-kpis psql -U postgres -d kpis_db
INSERT INTO kpis (sucursal_id, periodo, total_ventas, cantidad_transacciones,
  ticket_promedio, meta_mensual, porcentaje_cumplimiento,
  productos_bajo_minimo, rotacion_promedio, dias_sin_reposicion)
VALUES (1, '2026-06', 15000000, 320, 46875, 18000000, 83.3, 7, 4.2, 3);
```

---

## front — Frontend

**Stack**: React 19 + Vite + TypeScript. Ubicado en `front/`.

**Dev server**: `npm run dev` desde `front/` → `http://localhost:5173`

**Estado**: conectado al BFF. Ya no usa datos mock para auth, usuarios, sucursales, KPIs, datos consolidados ni reportes. Los datos mock restantes en `src/data.ts` corresponden a secciones sin endpoint BFF aún (inventario, reportes guardados, log de auditoría, sesiones, integraciones).

### Comandos

```shell
cd front
npm install       # instalar dependencias
npm run dev       # dev server → http://localhost:5173
npm run build     # build de producción → dist/
```

### Estructura de `front/src/`

```
src/
  main.tsx                    # entry point — monta AuthProvider + PrefsProvider + App
  App.tsx                     # shell: AuthGate (loading → Login → AppShell), routing por vista
  index.css                   # importa tokens.css + kit.css + maplibre-gl.css
  data.ts                     # mocks residuales: inventario, reportesGuardados, auditLog, etc.
  api/
    types.ts                  # interfaces TS: UsuarioDTO, SucursalDTO, RespuestaKpis, DatoConsolidadoDTO, etc.
    client.ts                 # fetch wrapper: Authorization header, auto-refresh en 401, AbortSignal
    auth.ts                   # loginApi, logoutApi, refreshApi
    usuarios.ts               # listarUsuarios, crearUsuario, desactivarUsuario, activarUsuario
    sucursales.ts             # listarSucursales, crearSucursal, actualizarSucursal, cambiarEstadoSucursal
    kpis.ts                   # obtenerKpis, obtenerComparativo
    reportes.ts               # exportarReporte → blob download
    datos.ts                  # listarDatos, reprocesarDato, logDato
  context/
    AuthContext.tsx            # JWT en memoria, refreshToken en localStorage 'cord_rt', auto-restore al montar
    PrefsContext.tsx           # tema claro/oscuro + densidad, persiste en localStorage
  hooks/
    useDebounce.ts            # debounce 350ms
  utils/
    rut.ts                    # validarRut (módulo 11), formatearRut
  components/
    Icon.tsx                  # wrapper de lucide-react con lookup por nombre kebab-case
    Primitives.tsx            # Badge, Delta, Button, Avatar, ColorAvatar, Switch, KpiCard, PageHead, Panel, ModalOverlay
    Sidebar.tsx               # sidebar fijo 240px — usa AuthContext para nombre/rol/iniciales
    Topbar.tsx                # barra superior sticky con búsqueda, alertas, exportar
    Chart.tsx                 # gráfico de línea SVG (theme-aware, tooltip hover)
    Login.tsx                 # login real via AuthContext, validación, manejo de errores
  views/
    DashboardView.tsx         # KPIs reales con selector sucursal+período (obtenerKpis)
    ReportesView.tsx          # comparativo real + export real (exportarReporte), umbrales >90/60-90/<60
    InventoryView.tsx         # datos mock — sin endpoint BFF
    UsersView.tsx             # CRUD real de usuarios, validación RUT, debounced search
    BranchesView.tsx          # CRUD real de sucursales (ms-datos), mapa MapLibre con coords estáticas
    DatosView.tsx             # datos consolidados: filtros, reprocesar, log trazabilidad (CA-1.17–1.19)
    ReportesGuardadosView.tsx # datos mock — sin endpoint BFF
    ConfiguracionView.tsx     # perfil desde AuthContext; logout en tab Seguridad
public/
  fonts/                      # Geist, Geist Mono, Inter (TTF, full weight range)
  assets/
    logo-cordillera.svg       # lockup horizontal
    logo-mark.svg             # ícono solo (usado como favicon)
```

### Patrones clave del frontend

- **Auth**: `accessToken` en estado React (memoria), `refreshToken` en `localStorage['cord_rt']`. En 401 → `client.ts` llama refresh automáticamente y reintenta.
- **AbortController**: todos los `useEffect` de fetch crean un `AbortController` y lo cancelan al desmontar.
- **Debounce**: `useDebounce(value, 350)` en campos de búsqueda.
- **RUT**: `validarRut(rut, dv)` en `UsersView` antes de submit (módulo 11 chileno).
- **Coords del mapa**: `BranchesView` tiene una tabla estática `COORDS` por nombre de sucursal — la API no provee lat/lng.

### Dependencias relevantes

| Paquete | Uso |
|---|---|
| `lucide-react` | Íconos (stroke 1.75, lookup dinámico por nombre kebab-case) |
| `maplibre-gl` | Mapa dark en BranchesView con tiles CartoCDN |
| `react-router-dom` | Instalado, no usado aún (routing por estado interno en App.tsx) |

### Design system

Basado en el **Cordillera Design System** (`design-handoff/cordillera-design-system/`):
- Paleta dark: `#0F0F0F` base → `#1A1A1A` sidebar → `#1E1E1E` cards → `#252525` hover
- Fuentes: **Geist** (títulos) · **Inter** (cuerpo) · **Geist Mono** (números, KPIs, monospace)
- Tema claro disponible vía `[data-theme="light"]` — se cambia desde Configuración → Interfaz
- Densidad de datos: compact / normal / wide — se cambia desde Configuración → Interfaz

### URLs de los servicios (desarrollo)

| Servicio          | URL                      |
|-------------------|--------------------------|
| BFF               | `http://localhost:8090`  |
| ms-auth           | `http://localhost:8088`  |
| ms-users          | `http://localhost:8085`  |
| ms-datos          | `http://localhost:8089`  |
| ms-kpis           | `http://localhost:8086`  |
| front dev server  | `http://localhost:5173`  |
| RabbitMQ UI       | `http://localhost:15672` |
