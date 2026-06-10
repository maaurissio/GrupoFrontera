# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Management-monitoring platform for a multi-branch retail company (Grupo Cordillera). The system is a **BFF + microservices** architecture: each microservice is an independent Quarkus 3 / Java 21 / Maven project with its own PostgreSQL database. Cross-service relationships are **logical, not real foreign keys** — reference another service's entity by an ID field (e.g. `sucursalRefId`), never a JPA `@ManyToOne` across service boundaries.

### Monorepo layout

Each top-level directory is a self-contained project (its own `pom.xml`, `mvnw`, `Dockerfile`, `docker-compose.yml`). There is **no root aggregator POM** — build and run each service from its own directory.

| Directory     | Role                         | Status                                                  |
|---------------|------------------------------|---------------------------------------------------------|
| `ms-users`    | User/role/branch domain      | **Fully implemented** — the reference for all patterns  |
| `ms-auth`     | Authentication & JWT         | **Fully implemented** — JWT HS384, BCrypt, refresh tokens |
| `ms-datos`    | Data ingestion               | Scaffold                                                |
| `ms-kpis`     | KPI computation              | Scaffold                                                |
| `ms-reportes` | Reporting                    | Scaffold                                                |
| `bff`         | Backend-for-frontend         | Empty                                                   |
| `front`       | Frontend React + Vite + TS   | **UI completa implementada** — Cordillera Design System, 7 vistas, datos mock, esperando BFF |

Java package convention: `com.grupofrontera.ms<name>` (e.g. `com.grupofrontera.msusers`). `groupId` is `com.grupofrontera`. Note: `ms-users/contexto_ms_users.md` documents the original design but is **stale on two points** — the real package is `com.grupofrontera.*` (not `cl.duoc.cordillera`) and the Quarkus platform version in `pom.xml` is `3.36.0` (not 3.34.5). Trust the code/POM over that doc.

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

Run a single test class / method:
```shell
./mvnw test -Dtest=UsersResourceTest
./mvnw test -Dtest=UsersResourceTest#methodName
```

Database (per service, e.g. ms-users) — DevServices are **disabled**, so Postgres must be running. See `ms-users/SETUP.md` for full setup guide.

**Desarrollo (BD en Docker, app en local):**
```shell
docker-compose up -d db-users   # Solo la BD — NO usar "up -d" a secas al clonar (falla sin target/)
./mvnw quarkus:dev
```

**Todo en Docker (BD + app):**
```shell
./mvnw package -DskipTests      # Primero compilar el JAR
docker-compose up -d            # Luego levantar ambos contenedores
```

**Acceder a la BD directamente:**
```shell
docker exec -it pg-users psql -U usuario_cordillera -d db_users
```

Swagger UI is enabled in every service at `/swagger-ui`.

| Service    | Port | DB port |
|------------|------|---------|
| `ms-auth`  | 8081 | 5435    |
| `ms-users` | 8082 | 5434    |

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

## Database notes

- `application.properties` currently uses `quarkus.hibernate-orm.schema-management.strategy=drop-and-create` with `sql-load-script=import.sql` — the schema is **dropped and reseeded on every startup**. This is dev-only; switch to `update` (or a `%prod` profile) before any production use.
- Stack: PostgreSQL 16, Hibernate ORM + Panache, `quarkus-rest` + `quarkus-rest-jackson`, `quarkus-hibernate-validator`, `quarkus-smallrye-openapi`. Tests use `quarkus-junit5` + `rest-assured`.

## ms-auth — Authentication microservice

**Fully implemented.** Port 8081, DB db_auth (port 5435). See `ms-auth/SETUP.md`.

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

### Integration flow (without BFF)

```
POST /usuarios          → ms-users:8082  → returns { id: UUID, ... }
POST /auth/register     → ms-auth:8081   → body: { usuarioId, email, password }
POST /auth/login        → ms-auth:8081   → returns { accessToken, refreshToken }
POST /auth/validate     → ms-auth:8081   → header: Authorization: Bearer <token>
```

## front — Frontend

**Stack**: React 19 + Vite + TypeScript. Ubicado en `front/`.

**Dev server**: `npm run dev` desde `front/` → `http://localhost:5173`

**Decisión de arquitectura**: El frontend consumirá datos a través del **BFF** (aún no implementado). Actualmente opera con datos mock en `src/data.ts`. No conectar el front directamente a los microservicios — toda la comunicación debe pasar por el BFF cuando esté disponible.

**CORS**: Habilitado en ms-users y ms-auth para `http://localhost:5173` (ver `application.properties` de cada servicio).

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
  main.tsx                    # entry point — monta PrefsProvider + App
  App.tsx                     # shell: auth state, routing por vista
  index.css                   # importa tokens.css + kit.css + maplibre-gl.css
  data.ts                     # datos mock alineados a CA-* (reemplazar con calls al BFF)
  styles/
    tokens.css                # variables CSS del design system (colores, tipografía, spacing)
    kit.css                   # estilos de componentes (botones, badges, tabla, inputs, cards)
  context/
    PrefsContext.tsx           # tema claro/oscuro + densidad, persiste en localStorage
  components/
    Icon.tsx                  # wrapper de lucide-react con lookup por nombre kebab-case
    Primitives.tsx            # Badge, Delta, Button, Avatar, ColorAvatar, Switch, KpiCard, PageHead, Panel, ModalOverlay
    Sidebar.tsx               # sidebar fijo 240px con nav + footer de usuario
    Topbar.tsx                # barra superior sticky con búsqueda, alertas, exportar
    Chart.tsx                 # gráfico de línea SVG (theme-aware, tooltip hover)
    Login.tsx                 # pantalla de login + ExportModal
  views/
    DashboardView.tsx         # CA-DASH-01..04: KPIs, chart, module cards, ventas recientes
    ReportesView.tsx          # CA-REP-01..03: filtros, KPIs, chart, tabla comparativo
    InventoryView.tsx         # CA-INV-01..03: tabla SKU, filtros, modal editar stock, panel alertas
    UsersView.tsx             # CA-USERS-01..04: tabla usuarios, modales crear/confirmar/detalle
    BranchesView.tsx          # lista sucursales + mapa MapLibre dark + modal CRUD
    ReportesGuardadosView.tsx # historial, favoritos, reportes programados
    ConfiguracionView.tsx     # tabs: Perfil, Notificaciones, Interfaz, Sucursales, Integraciones, Auditoría, Seguridad
public/
  fonts/                      # Geist, Geist Mono, Inter (TTF, full weight range)
  assets/
    logo-cordillera.svg       # lockup horizontal
    logo-mark.svg             # ícono solo (usado como favicon)
```

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

### Conectar al BFF (pendiente)

Cuando el BFF esté implementado:
1. Reemplazar `src/data.ts` con un cliente HTTP (fetch/axios) apuntando al BFF
2. Conectar login en `App.tsx` a `POST /auth/login` via BFF
3. Guardar el JWT y enviarlo en headers de cada request
4. Las vistas no necesitan cambios — solo cambia la fuente de datos

### URLs de los servicios (desarrollo)

| Variable          | Valor                    |
|-------------------|--------------------------|
| ms-auth base URL  | `http://localhost:8081`  |
| ms-users base URL | `http://localhost:8082`  |
| front dev server  | `http://localhost:5173`  |
