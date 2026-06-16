# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Management-monitoring platform for a multi-branch retail company (Grupo Cordillera). The system is a **BFF + microservices** architecture: each microservice is an independent Quarkus 3 / Java 21 / Maven project with its own PostgreSQL database. Cross-service relationships are **logical, not real foreign keys** — reference another service's entity by an ID field (e.g. `sucursalRefId`), never a JPA `@ManyToOne` across service boundaries.

### Monorepo layout

Each top-level directory is a self-contained project (its own `pom.xml`, `mvnw`, `Dockerfile`). There is **no root aggregator POM** — build and run each service from its own directory. **Hay un `docker-compose.yml` global en la raíz** que levanta TODO el stack (infra + microservicios + front) en contenedores; ese es el modo de ejecución actual (ver "Cómo levantar todo el stack").

| Directory     | Role                         | Status                                                  |
|---------------|------------------------------|---------------------------------------------------------|
| `ms-users`    | User/role/branch domain      | **Fully implemented** — the reference for all patterns  |
| `ms-auth`     | Authentication & JWT         | **Fully implemented** — JWT HS384, BCrypt, refresh tokens |
| `ms-datos`    | Data ingestion               | **Fully implemented** — Flyway, catálogo geográfico, 4 sucursales + 5000 datos semilla |
| `ms-kpis`     | KPI computation              | **Fully implemented** — Flyway, consume RabbitMQ, 96 KPIs semilla (4 suc × 12 meses) |
| `ms-reportes` | Reporting                    | **Fully implemented** — puerto 8087, exportación PDF (OpenPDF) + Excel (Apache POI) |
| `bff`         | Backend-for-frontend         | **Fully implemented** — integra todos los microservicios |
| `front`       | Frontend React + Vite + TS   | **Fully implemented** — conectado al BFF, 8 vistas      |

Java package convention: `com.grupofrontera.ms<name>` (e.g. `com.grupofrontera.msusers`). `groupId` is `com.grupofrontera`. Note: `ms-users/contexto_ms_users.md` documents the original design but is **stale on two points** — the real package is `com.grupofrontera.*` (not `cl.duoc.cordillera`) and the Quarkus platform version in `pom.xml` is `3.36.0` (not 3.34.5). Trust the code/POM over that doc.

---

## Puertos — IMPORTANTE: conflictos en esta máquina

Esta máquina tiene servicios Windows que ocupan puertos por defecto. Los puertos fueron reasignados:

| Servicio    | Puerto HTTP | Puerto BD (host) | BD name (dev local) | BD name (docker-compose) |
|-------------|-------------|------------------|---------------------|--------------------------|
| `ms-auth`   | **8088**    | 5435             | db_auth             | auth_db                  |
| `ms-users`  | **8085** ⚠️ | 5434             | db_users            | users_db                 |
| `ms-datos`  | **8089** ⚠️ | **5437** ⚠️      | grupofrontera       | datos_db                 |
| `ms-kpis`   | **8086**    | 5438             | kpis_db             | kpis_db                  |
| `ms-reportes` | **8087**  | —                | —                   | —                        |
| `bff`       | **8090**    | —                | —                   | —                        |
| `front`     | **5173**    | —                | —                   | —                        |

> ⚠️ **El nombre de la BD difiere según el modo de ejecución.** El `application.properties` de cada
> servicio (modo dev local con `mvnw`) usa los nombres de la columna "dev local". El `docker-compose.yml`
> global **sobrescribe la URL JDBC con variables de entorno** (`QUARKUS_DATASOURCE_JDBC_URL`) apuntando a
> los nombres de la columna "docker-compose". Para inspeccionar la BD con `psql`, usa el nombre correcto
> según cómo esté corriendo: actualmente corre vía docker-compose, así que la BD de datos es `datos_db`
> (no `grupofrontera`) y los contenedores se llaman `gf_datos_db`, `gf_kpis_db`, etc.

> **¿Por qué los puertos no-estándar?**
> - Puerto 8080: ocupado por **Jenkins** (`java`, PID fijo)
> - Puerto 8082: ocupado por **SSRS** (SQL Server Reporting Services, `RSHostingService`, HTTP.sys)
> - Puerto 5432: conflicto entre **PostgreSQL local** y Docker — datos-db usa 5437

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

### Cómo levantar todo el stack

Hay **dos modos**. El modo actual es **docker-compose** (todo en contenedores).

#### Modo A — docker-compose (recomendado, todo en contenedores)

No necesitas Maven ni Node instalados; cada servicio se compila dentro de Docker (multi-stage).

```powershell
docker compose up -d --build      # build + run de todo el stack
docker compose logs -f            # ver logs
docker compose down               # apagar (conserva datos en volúmenes)
docker compose down -v            # apagar + BORRAR datos (reset total)

# Reconstruir solo algunos servicios tras un cambio de código:
docker compose build ms-datos bff front
docker compose up -d ms-datos bff front
```

Contenedores: `gf_ms_auth`, `gf_ms_users`, `gf_ms_datos`, `gf_ms_kpis`, `gf_ms_reportes`, `gf_bff`,
`gf_front`, más las BDs `gf_auth_db`, `gf_users_db`, `gf_datos_db`, `gf_kpis_db` y `gf_rabbitmq`.
Todas las BDs usan `postgres`/`postgres`. Inspeccionar una BD:
`docker exec gf_datos_db psql -U postgres -d datos_db -c "SELECT ..."`.

> **Migraciones Flyway al arrancar**: ms-datos y ms-kpis aplican sus migraciones automáticamente
> (`migrate-at-start=true`). Las semillas son parte de las migraciones, así que **ambos servicios quedan
> poblados solos** con una BD nueva — sin pasos manuales. Ver "Database notes" para el detalle de los seeds.

#### Modo B — dev local con `mvnw` (live reload por servicio)

Levanta solo la infra en Docker y corre cada microservicio con `mvnw quarkus:dev`:

```powershell
# 1. Solo infraestructura
docker compose up -d auth-db users-db datos-db kpis-db rabbitmq

# 2–6. Cada servicio en su propia terminal PowerShell
cd ms-auth   && .\mvnw.cmd quarkus:dev   # terminal 1
cd ms-users  && .\mvnw.cmd quarkus:dev   # terminal 2
cd ms-datos  && .\mvnw.cmd quarkus:dev -Dquarkus.live-reload.port=8193  # terminal 3 (evita choque con Jenkins)
cd ms-kpis   && .\mvnw.cmd quarkus:dev   # terminal 4
cd bff       && .\mvnw.cmd quarkus:dev   # terminal 5
cd front     && npm run dev              # terminal 6
```

> ⚠️ En modo B los nombres de BD del `application.properties` (`db_auth`, `db_users`, `grupofrontera`)
> NO coinciden con los que crea docker-compose (`auth_db`, `users_db`, `datos_db`). Si levantas la infra
> con docker-compose y los ms con `mvnw`, ms-datos buscará `grupofrontera` y fallará: o creas esa BD a mano,
> o defines la env var `DB_URL` apuntando a `datos_db`.

#### Credenciales de ms-auth (ambos modos)

ms-auth tiene el `import.sql` **vacío**: las credenciales se registran tras cada arranque con BD nueva.

```powershell
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
- ms-datos usa Flyway (`migrate-at-start=true`, `generation=none`). ms-kpis también usa Flyway. **Para cambiar el esquema o los datos de ms-datos/ms-kpis hay que añadir una nueva migración `V#__*.sql` en `db/migration/` — NUNCA editar una migración ya aplicada** (Flyway valida el checksum y el arranque falla). Como las migraciones ya corrieron en los volúmenes Docker existentes, cualquier corrección a datos sembrados debe ir en una migración nueva con `UPDATE`/`TRUNCATE`+`INSERT`, no editando la vieja.
- Stack: PostgreSQL 16, Hibernate ORM + Panache, `quarkus-rest` + `quarkus-rest-jackson`, `quarkus-hibernate-validator`, `quarkus-smallrye-openapi`. Tests use `quarkus-junit5` + `rest-assured`.

#### Migraciones y datos semilla de ms-datos (`db/migration/`)

| Versión | Contenido |
|---------|-----------|
| `V1__init.sql` | tablas `fuente`, `sucursal`, `dato_consolidado`, `log_trazabilidad` + índices |
| `V2__sucursal_coordenadas.sql` | agrega `latitud`/`longitud` a `sucursal` |
| `V3__region_ciudad_y_seed.sql` | catálogo `region`/`ciudad` (16 regiones, 57 ciudades) + 3 sucursales (ids 1–3) |
| `V4__seed_datos_retail.sql` | 5 fuentes + 1000 datos consolidados (retail hogar/tecnología) + logs — **reemplazado por V6** |
| `V5__naturalizar_montos.sql` | reescribe los montos del JSON de V4 para que no terminen en `000` |
| `V6__rehacer_sucursales_y_5000_datos.sql` | **reemplaza las 3 sucursales por 4** (ids 1–4: Don Raucho/Angol, Jurel San Jose/Coronel, Hogar Central/Santiago, TecnoSur/Puerto Montt) y **regenera 5000 datos** con valores naturales (no terminados en 000) |

- **V4** genera 1000 filas con aritmética determinista, repartidas en 5 `tipo_dato`: `VENTA` (30%), `INVENTARIO` (30%), `AJUSTE_INVENTARIO` (20%), `DEVOLUCCION` (10%), `TRANSFERENCIA` (10%); 12 meses (jul-2025 → jun-2026); estados PROCESADO/VALIDADO/RECIBIDO/ERROR. El campo `valor` es **JSON** (texto) con forma distinta por tipo — el front lo parsea en `DatosView` (`parseValor`).

#### Migraciones y datos semilla de ms-kpis (`db/migration/`)

| Versión | Contenido |
|---------|-----------|
| `V1__crear_tablas_kpis.sql` | tablas `indicador_ventas`, `indicador_inventario` |
| `V2__seed_kpis_retail.sql` | 36 + 36 indicadores (3 sucursales × 12 meses) con patrón estacional |
| `V3__actualizar_valores_kpis.sql` | `TRUNCATE` + re-`INSERT` con montos naturales (no terminados en 000) |
| `V4__kpis_4_sucursales.sql` | **regenera para las 4 sucursales** (ids 1–4): 48 + 48 indicadores generados por SQL (factor estacional + jitter natural) |

- Los KPIs también se recalculan en vivo desde eventos RabbitMQ (`venta.realizada`, `actualizacion.stock`); el seed solo garantiza que el dashboard tenga datos desde el primer arranque.

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
| GET    | /api/bff/usuarios                  | ms-users (solo ACTIVO) |
| GET    | /api/bff/usuarios/todos            | ms-users (incl. inactivos) |
| GET    | /api/bff/usuarios/{id}             | ms-users         |
| POST   | /api/bff/usuarios                  | ms-users + ms-auth |
| PUT    | /api/bff/usuarios/{id}/activar     | ms-users         |
| PUT    | /api/bff/usuarios/{id}/desactivar  | ms-users         |
| GET    | /api/bff/usuarios/{id}/sucursales  | ms-users (`/usuario-sucursales`, enriquecido) |
| POST   | /api/bff/usuarios/{id}/sucursales  | ms-users (asigna sucursal) |
| DELETE | /api/bff/usuarios/asignaciones-sucursal/{asignacionId} | ms-users (desasigna) |
| GET    | /api/bff/sucursales                | ms-datos         |
| POST   | /api/bff/sucursales                | ms-datos         |
| PUT    | /api/bff/sucursales/{id}           | ms-datos         |
| PUT    | /api/bff/sucursales/{id}/estado    | ms-datos         |
| GET    | /api/bff/kpis                      | ms-kpis          |
| GET    | /api/bff/kpis/comparativo          | ms-kpis          |
| GET    | /api/bff/datos                     | ms-datos         |
| POST   | /api/bff/datos/{id}/reprocesar     | ms-datos         |
| GET    | /api/bff/reportes/exportar         | ms-reportes      |

> **Export de reportes** (`/reportes/exportar?formato=pdf\|xlsx&periodo=YYYY-MM[&sucursalId=N]`):
> - **Con `sucursalId`** → reporte individual de esa sucursal.
> - **Sin `sucursalId`** → **reporte consolidado de todas las sucursales** (tabla comparativa + fila de totales).
> - `formato=pdf` (OpenPDF, diseño corporativo con encabezado/pie) o `xlsx` (Apache POI).
> - ms-reportes resuelve los **nombres de sucursal** vía un cliente REST a ms-datos (`datos-api`,
>   config `quarkus.rest-client.datos-api.url`); si ms-datos no responde, cae a "Sucursal {id}".
> - 404 si no hay KPIs (individual: esa sucursal/período; consolidado: ningún dato en el período).

### Detalles de implementación BFF

- **CORS**: habilitado para `http://localhost:5173`. ⚠️ En Quarkus 3.36 la clave es `quarkus.http.cors.enabled=true` (NO `quarkus.http.cors=true`, que se ignora silenciosamente con un warning). **El export de reportes requiere `quarkus.http.cors.exposed-headers=Content-Disposition`** — sin eso el navegador no deja leer el nombre del archivo descargado (PDF/Excel).
- **Error propagation**: `ClientExceptionMapper` (`bff/src/main/java/com/grupofrontera/bff/exception/`) propaga códigos 4xx de los microservicios correctamente. `quarkus.rest-client.disable-default-mapper=true` en `application.properties`.
- **Alta de usuario** (`UsuarioResource.crear`): orquesta ms-users → ms-auth. Usa `HashMap` (no `Map.of`, que lanza NPE con `fechaNacimiento=null`) y lee la entidad upstream con `Response.readEntity(...)` (no `getEntity()`, que en un cliente JAX-RS devuelve el `InputStream`). Propaga el status upstream (p. ej. 409 RUT/email duplicado).
- **Endpoint de estado de sucursal** (`PUT /sucursales/{id}/estado`): el body espera el campo **`activo`** (booleano), no `habilitada`. Mismo contrato en ms-datos (`EstadoRequest.activo`).
- **Sin seguridad interna**: el BFF no valida JWT — confía en que ms-auth valida. ms-users no tiene extensiones de seguridad.
- **Asignación usuario↔sucursal**: `GET/POST /api/bff/usuarios/{usuarioId}/sucursales` y `DELETE /api/bff/usuarios/asignaciones-sucursal/{asignacionId}`. ⚠️ ms-users expone esto en **`/usuario-sucursales`** (NO en `/usuarios/{id}/sucursales`): el `UsersClient` del BFF apunta a `/usuario-sucursales`, `/usuario-sucursales/usuario/{id}` y `/usuario-sucursales/{id}/desactivar`. El POST del BFF inyecta `usuarioId` (del path) en el body `{usuarioId, sucursalId}` que espera ms-users; el GET enriquece cada asignación con `sucursalNombre` (vía ms-datos). El front usa esto en `UsersView` (botón "Asignar sucursales").
- **Dos modelos de sucursal**: `/api/bff/sucursales` apunta a ms-datos (id: `Long`, ahora con `latitud`/`longitud`). ms-users tiene sus propias sucursales (id: `UUID`) — no expuestas en BFF.

---

## ms-kpis — KPI microservice

Puerto **8086**, BD kpis_db (puerto 5438). Requiere **RabbitMQ** corriendo en localhost:5672.

- Los KPIs se calculan a partir de eventos recibidos via RabbitMQ (`venta.realizada`, `actualizacion.stock`).
- **Ya NO arranca sin datos**: las migraciones Flyway siembran KPIs (tras `V4`: **96 KPIs = 4 sucursales × 12 meses** en `indicador_ventas` e `indicador_inventario`) — el dashboard tiene datos desde el primer arranque.
- Las tablas reales son **`indicador_ventas`** e **`indicador_inventario`** (no existe una tabla `kpis`). Para inspeccionar o añadir datos manualmente:

```sql
-- docker exec -it gf_kpis_db psql -U postgres -d kpis_db
SELECT sucursal_ref_id, periodo, total_ventas, porcentaje_cumplimiento
  FROM indicador_ventas ORDER BY sucursal_ref_id, periodo;

INSERT INTO indicador_ventas (sucursal_ref_id, periodo, total_ventas,
  cantidad_transacciones, ticket_promedio, meta_mensual,
  porcentaje_cumplimiento, fecha_calculo)
VALUES (1, '2026-07', 15847263, 421, 37642.00, 18000000, 88.04, NOW());
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
    periodo.ts                # ultimosMeses(periodo, n) + tipo ChartSeries — serie de meses para gráficos
  components/
    Icon.tsx                  # wrapper de lucide-react con lookup por nombre kebab-case
    Primitives.tsx            # Badge, Delta, Button, Avatar, ColorAvatar, Switch, KpiCard, PageHead, Panel, ModalOverlay
    Sidebar.tsx               # sidebar fijo 240px — usa AuthContext para nombre/rol/iniciales
    Topbar.tsx                # barra superior sticky con búsqueda, alertas, exportar
    Chart.tsx                 # gráfico de línea SVG (theme-aware, tooltip hover); ChartData admite fullLabels opcional
    Login.tsx                 # login real via AuthContext, validación, manejo de errores
  views/
    DashboardView.tsx         # KPIs reales + gráfico dinámico (obtenerKpis de los últimos 6 meses)
    ReportesView.tsx          # comparativo real + gráfico dinámico + export real, umbrales >90/60-90/<60
    InventoryView.tsx         # datos mock — sin endpoint BFF
    UsersView.tsx             # CRUD real de usuarios, validación RUT (9 dígitos + DV 0-9/K), debounced search. Modal "Asignar sucursales" (AssignBranchesModal): toggle por sucursal → POST/DELETE asignación, enriquecido con nombres.
    BranchesView.tsx          # CRUD real de sucursales (ms-datos), mapa MapLibre theme-aware con coords de la API. Botón "Cómo llegar" en BranchMap: geolocalización del navegador → ruta OSRM (router.project-osrm.org) dibujada como capa GeoJSON, con fallback a línea recta (haversine) si OSRM falla. La ruta se limpia al cambiar de sucursal y se re-pinta tras cambio de tema.
    DatosView.tsx             # datos consolidados: filtros (sucursal/tipo/período/estado), reprocesar, log trazabilidad (CA-1.17–1.19). El campo `valor` es JSON y se muestra parseado por tipo (parseValor). Tipo y estado son <select>; el período usa dos <input type="month"> enlazados (min/max) + chips de rango rápido (3/6/12 meses, aplican al instante) y etiqueta legible del rango.
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
- **Respuestas sin cuerpo**: `apiFetch` (`client.ts`) tolera 204 y 200 con body vacío (helper `parseBody`) — necesario para activar/desactivar, que devuelven 200 sin JSON.
- **RUT**: `validarRut(rut, dv)` en `UsersView` antes de submit (módulo 11 chileno). El modal limita el RUT a 9 dígitos y el DV a un carácter `0-9`/`K`.
- **Listado de usuarios**: `listarUsuarios()` llama a `/api/bff/usuarios/todos` (incluye inactivos) y el filtro "Solo activos" es del lado del cliente — así un usuario desactivado sigue visible y se puede reactivar.
- **Coords del mapa**: `BranchesView` usa `latitud`/`longitud` de la sucursal (editables en el modal). Fallback: tabla estática `COORDS` por nombre → centro por defecto. El estilo del mapa (`makeMapStyle`) sigue el tema claro/oscuro escuchando el evento `prefs-changed`.
- **Gráficos dinámicos**: Dashboard y Reportes construyen la serie del gráfico con KPIs reales de los últimos 6 meses (`ultimosMeses` en `utils/periodo.ts`); si no hay datos muestran estado vacío, no valores mock.

### Dependencias relevantes

| Paquete | Uso |
|---|---|
| `lucide-react` | Íconos (stroke 1.75, lookup dinámico por nombre kebab-case) |
| `maplibre-gl` | Mapa en BranchesView con tiles CartoCDN (light_all/dark_all según tema) |
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
