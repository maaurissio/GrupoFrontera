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
| `ms-datos`    | Catálogo de productos        | **Fully implemented** — Flyway, catálogo geográfico, 4 sucursales + 48 productos semilla, import JSON |
| `ms-kpis`     | KPI computation              | **Fully implemented** — Flyway, consume RabbitMQ, 96 KPIs semilla (4 suc × 12 meses) |
| `ms-reportes` | Reporting                    | **Fully implemented** — puerto 8087, exportación PDF (OpenPDF) + Excel (Apache POI): reporte de KPIs **y de inventario de productos**. Desde V1 tiene **BD propia** (Postgres + Flyway) para el historial real de reportes generados (`reporte_generado`) |
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
| `ms-reportes` | **8087**  | **5439**         | db_reportes         | reportes_db              |
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
./mvnw test                   # Run unit tests (@QuarkusTest + Mockito tests de la capa Service)
./mvnw verify                 # Unit + integration tests (*IT, via failsafe; skipITs=true by default)
./mvnw package                # Build → target/quarkus-app/quarkus-run.jar
./mvnw package -Dnative       # Native executable (needs GraalVM, or add -Dquarkus.native.container-build=true)
java -jar target/quarkus-app/quarkus-run.jar
```

`ms-auth` y `ms-users` además tienen un `package.json` mínimo con `npm run test` (wrapper de `mvnw test` + reporte de cobertura JaCoCo) — ver sección "Testing" más abajo.

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
`gf_front`, más las BDs `gf_auth_db`, `gf_users_db`, `gf_datos_db`, `gf_kpis_db`, `gf_reportes_db` y `gf_rabbitmq`.
Todas las BDs usan `postgres`/`postgres`. Inspeccionar una BD:
`docker exec gf_datos_db psql -U postgres -d datos_db -c "SELECT ..."`.

> **Migraciones Flyway al arrancar**: ms-datos, ms-kpis y ms-reportes aplican sus migraciones automáticamente
> (`migrate-at-start=true`). Las semillas son parte de las migraciones, así que **ms-datos y ms-kpis quedan
> poblados solos** con una BD nueva — sin pasos manuales (ms-reportes no siembra nada, su tabla
> `reporte_generado` arranca vacía y se llena sola con cada export real). Ver "Database notes" para el detalle.

#### Modo B — dev local con `mvnw` (live reload por servicio)

Levanta solo la infra en Docker y corre cada microservicio con `mvnw quarkus:dev`:

```powershell
# 1. Solo infraestructura
docker compose up -d auth-db users-db datos-db kpis-db reportes-db rabbitmq

# 2–7. Cada servicio en su propia terminal PowerShell
cd ms-auth     && .\mvnw.cmd quarkus:dev   # terminal 1
cd ms-users    && .\mvnw.cmd quarkus:dev   # terminal 2
cd ms-datos    && .\mvnw.cmd quarkus:dev -Dquarkus.live-reload.port=8193  # terminal 3 (evita choque con Jenkins)
cd ms-kpis     && .\mvnw.cmd quarkus:dev   # terminal 4
cd ms-reportes && .\mvnw.cmd quarkus:dev   # terminal 5
cd bff         && .\mvnw.cmd quarkus:dev   # terminal 6
cd front       && npm run dev              # terminal 7
```

> ⚠️ En modo B los nombres de BD del `application.properties` (`db_auth`, `db_users`, `grupofrontera`, `db_reportes`)
> NO coinciden con los que crea docker-compose (`auth_db`, `users_db`, `datos_db`, `reportes_db`). Si levantas la infra
> con docker-compose y los ms con `mvnw`, ms-datos buscará `grupofrontera` y ms-reportes buscará `db_reportes`,
> y ambos fallarán: o creas esas BDs a mano, o defines la env var `DB_URL` apuntando al nombre real
> (`datos_db` / `reportes_db`).

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
- Stack: PostgreSQL 16, Hibernate ORM + Panache, `quarkus-rest` + `quarkus-rest-jackson`, `quarkus-hibernate-validator`, `quarkus-smallrye-openapi`. Los smoke tests `@QuarkusTest` (`*ResourceTest`) de ms-datos/ms-users usan `quarkus-junit5` + `rest-assured` y necesitan la BD real; los tests unitarios de la capa Service (`*ServiceTest`) usan `quarkus-junit5-mockito` y no la necesitan — ver "Testing". **ms-kpis y ms-reportes son la excepción**: sus `*ResourceTest` corren sobre **H2 en memoria** (`%test.quarkus.datasource.db-kind=h2`, `quarkus.hibernate-orm.database.generation=drop-and-create`, `quarkus.flyway.enabled=false` solo en el perfil `%test`), así que `mvnw test` pasa sin Postgres real en esos dos servicios.

#### Migraciones y datos semilla de ms-datos (`db/migration/`)

| Versión | Contenido |
|---------|-----------|
| `V1__init.sql` | tablas `fuente`, `sucursal`, `dato_consolidado`, `log_trazabilidad` + índices |
| `V2__sucursal_coordenadas.sql` | agrega `latitud`/`longitud` a `sucursal` |
| `V3__region_ciudad_y_seed.sql` | catálogo `region`/`ciudad` (16 regiones, 57 ciudades) + 3 sucursales (ids 1–3) |
| `V4__seed_datos_retail.sql` | 5 fuentes + 1000 datos consolidados (retail hogar/tecnología) + logs — **reemplazado por V6** |
| `V5__naturalizar_montos.sql` | reescribe los montos del JSON de V4 para que no terminen en `000` |
| `V6__rehacer_sucursales_y_5000_datos.sql` | **reemplaza las 3 sucursales por 4** (ids 1–4: Don Raucho/Angol, Jurel San Jose/Coronel, Hogar Central/Santiago, TecnoSur/Puerto Montt) y **regenera 5000 datos** con valores naturales (no terminados en 000) — **eliminados por V7** |
| `V7__productos_y_drop_datos.sql` | **elimina las tablas `dato_consolidado` y `log_trazabilidad`** (los 5000 datos) y crea la tabla **`producto`** (`codigo`, `nombre`, `sucursal_id` FK real, `categoria` enum, `stock`, `stock_minimo`, `precio`, `fecha_actualizacion_stock`, `activo`; UNIQUE `(codigo, sucursal_id)`) + **48 productos semilla** (12 por sucursal × las 8 categorías, precios naturales, algunos bajo mínimo) |
| `V8__sucursal_direccion_apertura.sql` | agrega `direccion` (VARCHAR 250) y `anio_apertura` (INT) a `sucursal`, ambos opcionales y sin seed — las 4 sucursales existentes quedan en NULL hasta que se editen desde el modal del front |

> **Dominio Producto (V7 en adelante).** El antiguo dominio "datos consolidados" (entidad `DatoConsolidado`, `LogTrazabilidad`, enum `EstadoDato`, sus DTOs/resource/service) fue **eliminado**. ms-datos ahora expone **`/api/v1/productos`** (CRUD + filtros `sucursalId`/`categoria`/`q`/`activo`, `POST /importar` insert-only, `GET /categorias`). `Fuente`/`Sucursal`/`Region`/`Ciudad` se mantienen sin cambios. La categoría es un enum: `ELECTRODOMESTICO, TV, MOVIL, CONSOLA, COMPUTACION, AUDIO, ACCESORIO, OTRO`.
>
> **Campos de sucursal post-V8**: `direccion`/`anioApertura` viajan en `SucursalRequest`/`SucursalResponse` y en el BFF (`SucursalRequestDTO`/`SucursalDTO`); el front los edita en `BranchModal` y los muestra en la tarjeta de detalle de `BranchesView`.

#### Migraciones y datos semilla de ms-kpis (`db/migration/`)

| Versión | Contenido |
|---------|-----------|
| `V1__crear_tablas_kpis.sql` | tablas `indicador_ventas`, `indicador_inventario` |
| `V2__seed_kpis_retail.sql` | 36 + 36 indicadores (3 sucursales × 12 meses) con patrón estacional |
| `V3__actualizar_valores_kpis.sql` | `TRUNCATE` + re-`INSERT` con montos naturales (no terminados en 000) |
| `V4__kpis_4_sucursales.sql` | **regenera para las 4 sucursales** (ids 1–4): 48 + 48 indicadores generados por SQL (factor estacional + jitter natural) |

- Los KPIs también se recalculan en vivo desde eventos RabbitMQ (`venta.realizada`, `actualizacion.stock`); el seed solo garantiza que el dashboard tenga datos desde el primer arranque.

#### Migraciones de ms-reportes (`db/migration/`)

| Versión | Contenido |
|---------|-----------|
| `V1__reporte_generado.sql` | tabla **`reporte_generado`** (`tipo` KPIS/INVENTARIO, `formato` PDF/XLSX, `periodo` nullable, `sucursal_id` nullable = consolidado, `sucursal_nombre` snapshot, `favorito`, `fecha_generacion`) — sin seed, arranca vacía |

> **ms-reportes no guarda el archivo (PDF/Excel) en sí, solo los parámetros usados para generarlo.** Cada
> llamada exitosa a `/reportes/exportar` o `/reportes/inventario` inserta una fila en `reporte_generado`
> **después** de generar los bytes (no antes, para no loguear intentos fallidos). El historial completo se
> expone en `/reportes-guardados` (`GET` listar, `DELETE /{id}`, `PUT /{id}/favorito`) — ver sección
> "ms-reportes" más abajo. Volver a "descargar" un reporte ya guardado **regenera el archivo en el momento**
> (llamando de nuevo a `/exportar`/`/inventario`), así que también crea una fila nueva — es el comportamiento
> esperado, no un bug: cada generación real queda registrada, sin excepciones.

### Credenciales semilla (ms-users import.sql)

ms-users siembra 3 usuarios. ms-auth tiene el import.sql **vacío** — las credenciales se registran via `POST /auth/register` tras cada restart:

| usuarioId (UUID prefix)    | Email                   | Password       | Rol     |
|----------------------------|-------------------------|----------------|---------|
| `d1111111-…`               | admin@cordillera.cl     | Admin1234!     | ADMIN   |
| `e2222222-…`               | soporte@cordillera.cl   | Soporte1234!   | SOPORTE |
| `f3333333-…`               | gerente@cordillera.cl   | Gerente1234!   | GERENTE |

---

## Testing

### ms-auth y ms-users — unit tests de la capa Service (Mockito)

Además de los smoke tests `@QuarkusTest` preexistentes (`AuthResourceTest`, `UsersResourceTest`, requieren la BD real), ambos servicios tienen tests unitarios de verdad sobre `service/`, mockeando los repositorios con Mockito (`quarkus-junit5-mockito`) — no arrancan CDI/Hibernate/datasource, corren en milisegundos sin BD:

| Servicio  | Clases de test | Cobertura |
|-----------|-----------------|-----------|
| `ms-auth`  | `AuthServiceTest` (16 tests) | `registrar`, `login`, `refresh` (rotación de refresh token), `logout`, `cambiarEstado`, `validate` |
| `ms-users` | `UsuarioServiceTest` (7), `RolServiceTest` (3), `UsuarioRolServiceTest` (3), `UsuarioSucursalServiceTest` (4) | CRUD, duplicados → 409, no-encontrado → 404, asignaciones usuario↔rol/sucursal |

`maven-surefire-plugin` excluye `**/*ResourceTest.java` por defecto (propiedad `surefire.excludes`, ver `pom.xml`), así que `npm run test` / `mvnw test` corren **solo** los `*ServiceTest` de Mockito — no necesitan BD. Ambos `pom.xml` tienen además `jacoco-maven-plugin` (0.8.12) con el goal `report` ligado a la fase `test`, que ahora siempre se alcanza (Surefire ya no falla por falta de BD). Cada microservicio tiene además un `package.json` mínimo:

```powershell
npm run test                       # = mvnw test → solo *ServiceTest + reporte JaCoCo en target/site/jacoco/index.html, sin BD
.\mvnw.cmd test -Dtest=AuthServiceTest                                                        # ms-auth: un test puntual, sin BD
.\mvnw.cmd test -Dtest=UsuarioServiceTest,RolServiceTest,UsuarioRolServiceTest,UsuarioSucursalServiceTest  # ms-users: idem
.\mvnw.cmd test -Pdb-tests                                                                     # corre TODO, incluidos los smoke tests *ResourceTest — requiere BD real arriba
```

> Los smoke tests `*ResourceTest`/`*ResourceIT` (`AuthResourceTest`, `UsersResourceTest`) no se eliminaron — siguen teniendo valor para verificación manual/CI con BD real — pero ya no corren en el flujo por defecto. Usa el perfil `-Pdb-tests` (o `-Dtest=NombreDeLaClase` puntual) cuando quieras ejecutarlos, con `docker compose up -d` o `mvnw quarkus:dev` levantando la BD primero.

### front — Vitest + React Testing Library

No había ningún framework de testing instalado; se agregó Vitest + `@testing-library/react` + jsdom. 15 tests en 7 archivos: `utils/rut.test.ts`, `utils/periodo.test.ts`, `hooks/useDebounce.test.ts`, `api/client.test.ts`, `api/auth.test.ts`, `context/PrefsContext.test.tsx`, `components/Primitives.test.tsx`.

```powershell
npm test                  # vitest run — no necesita el BFF ni los microservicios levantados
npm run test:coverage     # + reporte de cobertura (@vitest/coverage-v8) en front/coverage/ (HTML + lcov)
```

> **`front/vitest.config.ts` está separado de `vite.config.ts`** (no fusionado). El `vite@^8.0.12` ya fijado en el proyecto (build Rolldown) es incompatible a nivel de tipos con el `vite` que trae `vitest` como dependencia interna — fusionar el campo `test` en `vite.config.ts` rompía `npm run build` (`tsc -b`, error TS2769 en los tipos de `Plugin`). `vitest` detecta `vitest.config.ts` automáticamente con prioridad sobre `vite.config.ts`, así que ambos archivos coexisten sin conflicto.
> **`front/src/test/setup.ts` incluye un polyfill de `localStorage`** en memoria (clase `MemoryStorage`). El Node de esta máquina expone un `localStorage` global nativo experimental que tapa el de jsdom y viene roto (objeto vacío, sin `getItem`/`setItem`/`clear`) — sin el polyfill, cualquier test que toque `localStorage` (p. ej. `PrefsContext`) falla con `TypeError`.

**VSCode**: extensión **Vitest** (`vitest.explorer`) instalada y recomendada en `.vscode/extensions.json` — clic derecho sobre un archivo `*.test.ts(x)` → "Run Test with Coverage" (requiere `@vitest/coverage-v8`, ya en `devDependencies`).

### Tareas pendientes

- **`bff/src/test/java/com/grupofrontera/bff/BffResourceTest.java` está desactualizado**: `testHelloEndpoint` espera el body `"Hello from Quarkus REST"`, pero el endpoint real `GET /api/health` devuelve `{"service":"bff","status":"UP"}` desde hace tiempo — el test quedó desincronizado con un cambio anterior al endpoint de salud. Hoy `./mvnw test` en `bff/` falla por esto (1 test, no relacionado con ningún cambio reciente de roles/sucursales/reportes). Falta actualizar la aserción para que valide el contrato JSON real.

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
| PUT    | /api/bff/usuarios/{id}              | ms-users (edita nombre/apellido/email/telefono/fechaNacimiento) |
| PUT    | /api/bff/usuarios/{id}/activar     | ms-users         |
| PUT    | /api/bff/usuarios/{id}/desactivar  | ms-users         |
| GET    | /api/bff/usuarios/{id}/sucursales  | ms-users (`/usuario-sucursales`, enriquecido) |
| POST   | /api/bff/usuarios/{id}/sucursales  | ms-users (asigna sucursal) |
| DELETE | /api/bff/usuarios/asignaciones-sucursal/{asignacionId} | ms-users (desasigna) |
| GET    | /api/bff/roles                     | ms-users (solo activos) |
| POST   | /api/bff/roles                     | ms-users (crea rol)     |
| GET    | /api/bff/sucursales                | ms-datos         |
| POST   | /api/bff/sucursales                | ms-datos         |
| PUT    | /api/bff/sucursales/{id}           | ms-datos         |
| PUT    | /api/bff/sucursales/{id}/estado    | ms-datos         |
| GET    | /api/bff/sucursales/{id}/usuarios  | ms-users (`/usuario-sucursales/sucursal/{id}` — dirección inversa de `/usuarios/{id}/sucursales`) |
| GET    | /api/bff/kpis                      | ms-kpis          |
| GET    | /api/bff/kpis/comparativo          | ms-kpis          |
| GET    | /api/bff/productos                 | ms-datos (filtros: sucursalId, categoria, q, activo) |
| GET    | /api/bff/productos/{id}            | ms-datos         |
| POST   | /api/bff/productos                 | ms-datos (201; 409 si código duplicado en la sucursal) |
| PUT    | /api/bff/productos/{id}            | ms-datos         |
| PUT    | /api/bff/productos/{id}/estado     | ms-datos (soft delete, body `{activo}`) |
| POST   | /api/bff/productos/importar        | ms-datos (importa lista JSON, **insert-only**) |
| GET    | /api/bff/productos/categorias      | ms-datos (valores del enum) |
| GET    | /api/bff/reportes/exportar         | ms-reportes (KPIs) |
| GET    | /api/bff/reportes/inventario       | ms-reportes (inventario de productos) |
| GET    | /api/bff/reportes-guardados                | ms-reportes (historial real de reportes generados) |
| DELETE | /api/bff/reportes-guardados/{id}           | ms-reportes (borra del historial) |
| PUT    | /api/bff/reportes-guardados/{id}/favorito  | ms-reportes (toggle favorito, body `{favorito}`) |

> **Export de reportes** (`/reportes/exportar?formato=pdf\|xlsx&periodo=YYYY-MM[&sucursalId=N]`):
> - **Con `sucursalId`** → reporte individual de esa sucursal.
> - **Sin `sucursalId`** → **reporte consolidado de todas las sucursales** (tabla comparativa + fila de totales).
> - `formato=pdf` (OpenPDF, diseño corporativo con encabezado/pie) o `xlsx` (Apache POI).
> - ms-reportes resuelve los **nombres de sucursal** vía un cliente REST a ms-datos (`datos-api`,
>   config `quarkus.rest-client.datos-api.url`); si ms-datos no responde, cae a "Sucursal {id}".
> - 404 si no hay KPIs (individual: esa sucursal/período; consolidado: ningún dato en el período).

> **Export de inventario** (`/reportes/inventario?formato=pdf\|xlsx[&sucursalId=N]`):
> - **Con `sucursalId`** → inventario de esa sucursal (tabla código·nombre·categoría·stock·mínimo·precio·valorizado + fila TOTAL).
> - **Sin `sucursalId`** → **consolidado** agrupado por sucursal con subtotal por grupo + TOTAL GENERAL (valorizado = Σ stock·precio).
> - ms-reportes consume los productos vía cliente REST a ms-datos (`datos-api`, `GET /api/v1/productos?sucursalId=`). 404 si no hay productos.

### Detalles de implementación BFF

- **CORS**: habilitado para `http://localhost:5173`. ⚠️ En Quarkus 3.36 la clave es `quarkus.http.cors.enabled=true` (NO `quarkus.http.cors=true`, que se ignora silenciosamente con un warning). **El export de reportes requiere `quarkus.http.cors.exposed-headers=Content-Disposition`** — sin eso el navegador no deja leer el nombre del archivo descargado (PDF/Excel).
- **Error propagation**: `ClientExceptionMapper` (`bff/src/main/java/com/grupofrontera/bff/exception/`) propaga códigos 4xx de los microservicios correctamente. `quarkus.rest-client.disable-default-mapper=true` en `application.properties`.
- **Alta de usuario** (`UsuarioResource.crear`): orquesta ms-users → ms-auth. Usa `HashMap` (no `Map.of`, que lanza NPE con `fechaNacimiento=null`) y lee la entidad upstream con `Response.readEntity(...)` (no `getEntity()`, que en un cliente JAX-RS devuelve el `InputStream`). Propaga el status upstream (p. ej. 409 RUT/email duplicado).
- **Edición de usuario** (`UsuarioResource.actualizar`, `PUT /api/bff/usuarios/{id}`): no toca ms-auth (solo perfil, no credenciales). `UsersClient.actualizarUsuario` devuelve `Object` (no `Response`) — un 4xx upstream (p. ej. 409 email duplicado) lo convierte el MicroProfile REST Client en `ClientWebApplicationException`, que el `ClientExceptionMapper` global traduce de vuelta al status/body correctos; no hace falta try/catch manual en el resource. ms-users (`UsuarioService.actualizar`) trata cada campo del DTO como opcional (`if (dto.campo != null) ...`), así que se soporta update parcial.
- **Roles**: ms-users ya tenía CRUD completo (`GET/POST/PUT /roles`, activar/desactivar) pero el BFF solo proxea `GET`/`POST /api/bff/roles` (listar + crear) — no hay edición ni activar/desactivar de roles expuestos, porque el front solo necesita listar y crear.
- **Endpoint de estado de sucursal** (`PUT /sucursales/{id}/estado`): el body espera el campo **`activo`** (booleano), no `habilitada`. Mismo contrato en ms-datos (`EstadoRequest.activo`).
- **Sin seguridad interna**: el BFF no valida JWT — confía en que ms-auth valida. ms-users no tiene extensiones de seguridad.
- **Asignación usuario↔sucursal**: `GET/POST /api/bff/usuarios/{usuarioId}/sucursales` y `DELETE /api/bff/usuarios/asignaciones-sucursal/{asignacionId}`. ⚠️ ms-users expone esto en **`/usuario-sucursales`** (NO en `/usuarios/{id}/sucursales`): el `UsersClient` del BFF apunta a `/usuario-sucursales`, `/usuario-sucursales/usuario/{id}` y `/usuario-sucursales/{id}/desactivar`. El POST del BFF inyecta `usuarioId` (del path) en el body `{usuarioId, sucursalId}` que espera ms-users; el GET enriquece cada asignación con `sucursalNombre` (vía ms-datos). El front usa esto en `UsersView` (botón "Asignar sucursales").
- **Dos modelos de sucursal**: `/api/bff/sucursales` apunta a ms-datos (id: `Long`, ahora con `latitud`/`longitud`/`direccion`/`anioApertura`). ms-users tiene sus propias sucursales (id: `UUID`) — no expuestas en BFF.
- **`GET /api/bff/sucursales/{id}/usuarios`**: vive en `SucursalResource` (BFF) pero llama a `UsersClient.listarUsuariosPorSucursal`, no a `DatosClient` — es la dirección inversa de `/api/bff/usuarios/{id}/sucursales`. Lo usa `BranchesView` para resolver el "Jefe" de la sucursal seleccionada (primer usuario asignado por fecha).
- **`/api/bff/reportes-guardados`** vive en un resource nuevo (`ReporteGeneradoResource`), separado de `ReporteResource` (que maneja `/api/bff/reportes/*`), porque en ms-reportes son dos paths raíz distintos (`/reportes` vs `/reportes-guardados`), no anidados.

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

## ms-reportes — Reporting microservice

Puerto **8087**, BD `reportes_db`/`db_reportes` (puerto 5439, ver "Puertos"). Consume ms-kpis (`kpis-api`) y
ms-datos (`datos-api`) vía REST client para construir los reportes; tiene su propia BD **solo** para el
historial de generación (`reporte_generado`), no para los datos de negocio en sí.

### Endpoints

| Method | Path                              | Descripción |
|--------|-----------------------------------|-------------|
| GET    | /reportes/dashboard                | Datos agregados de una sucursal/período (usado internamente y por `/comparativo`) |
| GET    | /reportes/comparativo              | Comparativo de todas las sucursales en un período |
| GET    | /reportes/exportar                 | Exporta KPIs a PDF/Excel (individual o consolidado) — **registra el historial** |
| GET    | /reportes/inventario                | Exporta inventario de productos a PDF/Excel (individual o consolidado) — **registra el historial** |
| GET    | /reportes-guardados                 | Lista el historial real de reportes generados (más reciente primero) |
| DELETE | /reportes-guardados/{id}           | Borra una fila del historial (no borra ningún archivo, porque no se guarda ninguno) |
| PUT    | /reportes-guardados/{id}/favorito  | Marca/desmarca favorito — body `{"favorito": true\|false}` |

### Key implementation details

- **Sin blobs**: `reporte_generado` guarda los **parámetros** de cada export exitoso (`tipo`, `formato`, `periodo`, `sucursalId`, `sucursalNombre` snapshot, `favorito`, `fechaGeneracion`), no el PDF/Excel en sí. Para "descargar" un reporte del historial, el front vuelve a llamar a `/exportar`/`/inventario` con esos mismos parámetros — el archivo se regenera al vuelo.
- **Orden de registro**: `ReportesRecurso` genera primero los bytes (`ExportacionServicio.exportarPdf/...Excel/...Comparativo/...Inventario...`) y **solo si eso no lanzó excepción** llama a `ReporteGeneradoService.registrar(...)`. Así nunca queda una fila de un export que en realidad falló.
- **`tipo`**: `"KPIS"` (desde `/exportar`) o `"INVENTARIO"` (desde `/inventario`). `sucursalId == null` significa reporte consolidado (todas las sucursales) — no un sucursalId real.
- **`ReporteGeneradoClient`** (BFF) es una interfaz de REST Client **separada** de `ReportesClient`, aunque comparten el mismo `configKey = "ms-reportes"` — porque `/reportes-guardados` es un path raíz distinto a `/reportes`, no un sub-path.

---

## front — Frontend

**Stack**: React 19 + Vite + TypeScript. Ubicado en `front/`.

**Dev server**: `npm run dev` desde `front/` → `http://localhost:5173`

**Estado**: conectado al BFF. Ya no usa datos mock para auth, usuarios, sucursales, KPIs, productos, reportes ni el historial de "Reportes guardados" (real desde que ms-reportes tiene BD propia). `src/data.ts` ya no tiene secciones mock — solo catálogos estáticos reales del propio front (nav, paleta de roles/estados, nombres de sucursal para el modal de "Programar reporte").

### Comandos

```shell
cd front
npm install         # instalar dependencias
npm run dev         # dev server → http://localhost:5173
npm run build       # build de producción → dist/
npm test            # vitest run — ver sección "Testing" más arriba
npm run test:coverage  # + reporte de cobertura en front/coverage/
```

### Estructura de `front/src/`

```
src/
  main.tsx                    # entry point — monta AuthProvider + PrefsProvider + App
  App.tsx                     # shell: AuthGate (loading → Login → AppShell), routing por vista
  index.css                   # importa tokens.css + kit.css + maplibre-gl.css
  data.ts                     # catálogos estáticos del front: nav, roleMeta/estadoMeta (colores/labels), modules (tarjetas del Dashboard), branchNames (sucursales para "Programar reporte") — sin datos mock de negocio
  api/
    types.ts                  # interfaces TS: UsuarioDTO, SucursalDTO, RespuestaKpis, ProductoDTO, CategoriaProducto/CATEGORIAS, ImportResultado, etc.
    client.ts                 # fetch wrapper: Authorization header, auto-refresh en 401, AbortSignal
    client.test.ts
    auth.ts                   # loginApi, logoutApi, refreshApi
    auth.test.ts
    usuarios.ts               # listarUsuarios, crearUsuario, actualizarUsuario, desactivarUsuario, activarUsuario
    roles.ts                  # listarRoles, crearRol
    sucursales.ts             # listarSucursales, crearSucursal, actualizarSucursal, cambiarEstadoSucursal, listarUsuariosSucursal (jefe real)
    kpis.ts                   # obtenerKpis, obtenerComparativo
    reportes.ts               # exportarReporte, exportarInventario → blob download (cada llamada exitosa también registra historial en ms-reportes)
    reportesGuardados.ts      # listarReportesGuardados, eliminarReporteGuardado, marcarFavoritoReporte
    productos.ts              # listarProductos, crearProducto, actualizarProducto, cambiarEstadoProducto, importarProductos
  context/
    AuthContext.tsx            # JWT en memoria, refreshToken en localStorage 'cord_rt', auto-restore al montar
    PrefsContext.tsx           # tema claro/oscuro + densidad, persiste en localStorage
    PrefsContext.test.tsx
  hooks/
    useDebounce.ts            # debounce 350ms
    useDebounce.test.ts
  utils/
    rut.ts                    # validarRut (módulo 11), formatearRut
    rut.test.ts
    periodo.ts                # ultimosMeses(periodo, n), formatearPeriodo("2026-06"→"Junio 2026") + tipo ChartSeries
    periodo.test.ts
    permisos.ts                # puedeVerUsuariosYRoles, puedeGestionarSucursales — control de acceso por rol (ver "Patrones clave")
  test/
    setup.ts                  # polyfill de localStorage (ver "Testing") + @testing-library/jest-dom
  components/
    Icon.tsx                  # wrapper de lucide-react con lookup por nombre kebab-case
    Primitives.tsx            # Badge, Delta, Button, Avatar, ColorAvatar, Switch, KpiCard, PageHead, Panel, ModalOverlay
    Primitives.test.tsx
    Sidebar.tsx               # sidebar fijo 240px — usa AuthContext para nombre/rol/iniciales; filtra Usuarios/Roles del nav con permisos.ts según el rol
    Topbar.tsx                # barra superior sticky con búsqueda, exportar
    Chart.tsx                 # gráfico de línea SVG (theme-aware, tooltip hover); ChartData admite fullLabels opcional
    Login.tsx                 # login real via AuthContext, validación, manejo de errores
  views/
    DashboardView.tsx         # KPIs reales: selector "Todas las sucursales"/individual + alcance "Mes"/"Todos los meses" (agrega vía obtenerComparativo) + gráfico dinámico de 6 meses. La tarjeta de módulo "Gestión de usuarios" se oculta si el rol no puede ver Usuarios/Roles (permisos.ts).
    ReportesView.tsx          # comparativo real + gráfico dinámico + export real, umbrales >90/60-90/<60
    UsersView.tsx             # CRUD real de usuarios, validación RUT (9 dígitos + DV 0-9/K), debounced search. Acciones por fila: Editar (EditUserModal: nombre/apellido/email/telefono), Asignar sucursales (AssignBranchesModal: toggle por sucursal → POST/DELETE asignación, enriquecido con nombres), Ver detalle, Activar/Desactivar.
    RolesView.tsx             # 3 roles reales del sistema (ADMIN/SOPORTE/GERENTE, ver "Patrones clave") con matriz de acceso por módulo (Sin acceso/Lectura/Edición/Total), conteo real de usuarios por rol (cruza con listarUsuarios), búsqueda, modal "Ver" con detalle, y modal "Nuevo rol" (select de NombreRol enum + descripción) para roles personalizados — estos quedan sin nivel de acceso definido hasta agregarlos a permisos.ts.
    BranchesView.tsx          # CRUD real de sucursales (ms-datos, incluye direccion/anioApertura), mapa MapLibre theme-aware con coords de la API. Tarjeta de detalle al seleccionar una sucursal: Ciudad/Apertura/Dirección (ms-datos), Jefe (real, primer usuario asignado vía ms-users), Ventas del mes (real, ms-kpis período actual), Stock (real, cuenta productos bajo mínimo en ms-datos). Botón "Cómo llegar": geolocalización del navegador (reintenta con baja precisión si GPS/Wi-Fi de alta precisión falla — típico en PCs de escritorio) → ruta OSRM (router.project-osrm.org) dibujada como capa GeoJSON, con fallback a línea recta (haversine) si OSRM falla. Para Gerente (puedeGestionarSucursales=false): sin botones Nueva/Editar/Activar-Desactivar, solo lectura.
    ProductosView.tsx         # catálogo de productos (ms-datos): filtros sucursal/categoría/búsqueda (debounced); tabla código·nombre·categoría·sucursal·stock (resaltado si < mínimo)·precio·actualizado; botón "Importar JSON" (insert-only, muestra insertados/rechazados); "Nuevo producto" (modal); export PDF/Excel de inventario.
    ReportesGuardadosView.tsx # historial real de reportes generados (ms-reportes vía BFF) — favorito persistido, eliminar borra el registro, descargar vuelve a generar el archivo (sin blob guardado) y refresca la lista. "Programar reporte" sigue siendo solo UI — no hay scheduler real.
    ConfiguracionView.tsx     # solo tema oscuro/claro (sin tabs Perfil/Notificaciones/Seguridad — se eliminaron por no tener funcionalidad real; logout vive en Sidebar, no aquí)
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
- **Control de acceso por rol** (`utils/permisos.ts`): basado en `usuario.roles` (string[] real desde `UsuarioDTO.roles`, ms-users). Solo `ADMIN` puede ver Usuarios/Roles (`puedeVerUsuariosYRoles`); `GERENTE` además no puede crear/editar/activar-desactivar Sucursales (`puedeGestionarSucursales`, solo lectura). Se aplica en 3 capas: `Sidebar` (oculta el ítem de nav), `App.tsx` (`vistaRestringida` — defensa en profundidad si se llega por otro camino, p. ej. las tarjetas de módulo del Dashboard) y dentro de cada vista (botones ocultos). Cualquier rol nuevo creado desde "Crear rol" en `RolesView` queda **sin nivel de acceso definido** (tratado como restringido por defecto) hasta que se agregue explícitamente a `permisos.ts`.
- **Tarjeta de detalle de sucursal** (`BranchesView`): agrega datos de 3 microservicios para una sola sucursal — Jefe vía `listarUsuariosSucursal` (ms-users), Ventas del mes vía `obtenerKpis` (ms-kpis, período actual), Stock vía `listarProductos` (ms-datos, cuenta `stock < stockMinimo`). Cada uno se carga por separado con su propio estado `undefined` (cargando) / `null` (sin datos) — un fallo en una de las 3 llamadas no bloquea las otras dos.

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
- Tema claro disponible vía `[data-theme="light"]` — se cambia desde Configuración (única opción que quedó en esa vista)
- Densidad de datos: compact / normal / wide — el mecanismo sigue en `PrefsContext` (`density`/`setDensity`, persiste en localStorage) pero ya no tiene control en la UI desde que se simplificó `ConfiguracionView`

### URLs de los servicios (desarrollo)

| Servicio          | URL                      |
|-------------------|--------------------------|
| BFF               | `http://localhost:8090`  |
| ms-auth           | `http://localhost:8088`  |
| ms-users          | `http://localhost:8085`  |
| ms-datos          | `http://localhost:8089`  |
| ms-kpis           | `http://localhost:8086`  |
| ms-reportes       | `http://localhost:8087`  |
| front dev server  | `http://localhost:5173`  |
| RabbitMQ UI       | `http://localhost:15672` |
