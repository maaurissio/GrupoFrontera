# ms-users — Usuarios, Roles y Sucursales

Microservicio que gestiona los **usuarios**, sus **roles con permisos por módulo** y las
**asignaciones de usuarios a sucursales**. Es la **referencia de patrones** del proyecto
(estructura en capas, DTOs, soft delete). Quarkus 3 / Java 21 / Maven.

## ¿Qué hace?

- CRUD de usuarios (nombre, apellido, email, teléfono, RUT) con soft delete (`activo`).
- CRUD de roles. Cada `Rol` tiene una columna `permisos` (JSON `Map<módulo, nivel>`).
  - Módulos: `dashboard`, `reportes`, `productos`, `usuarios`, `roles`, `sucursales`.
  - Niveles: `sin-acceso`, `lectura`, `edicion`, `total`.
- Asignación de roles a usuarios y de usuarios a sucursales (vía `usuario-sucursales`).
- Roles base sembrados en `import.sql`: **ADMIN** (todo `total`), **SOPORTE**, **GERENTE**.

Identificadores en **UUID**. Las sucursales se referencian por ID, sin FK hacia
`ms-datos`.

## Arquitectura en capas (patrón de referencia)

```
Resource (JAX-RS) → Service (@ApplicationScoped) → Repository (Panache) → Entity / DTO
```

- **Resources**: solo delegan, devuelven DTO o `Response`.
- **Services**: `@Transactional` al modificar; `toDTO()`/`fromDTO()` propios.
- **DTOs**: nunca exponen entidades (`*RequestDTO` / `*ResponseDTO`).
- **Errores**: `NotFoundException` (404) o `WebApplicationException` con estado explícito
  (409 para duplicados).

## Endpoints principales

| Método      | Path | Descripción |
|-------------|------|-------------|
| GET/POST    | `/usuarios` | Listar / crear usuarios |
| PUT         | `/usuarios/{id}` | Editar perfil |
| PUT         | `/usuarios/{id}/activar` · `/desactivar` | Soft delete |
| GET/POST    | `/roles` | Listar / crear roles (con permisos) |
| GET/POST    | `/usuario-sucursales` | Asignaciones usuario↔sucursal |

Puerto HTTP: **8085**.

## Base de datos

| Entorno         | URL JDBC                                     | Usuario / Clave |
|-----------------|----------------------------------------------|-----------------|
| Docker compose  | `jdbc:postgresql://users-db:5432/users_db`   | postgres / postgres |
| Dev local       | `jdbc:postgresql://localhost:5434/db_users`  | usuario_cordillera / cordillera_pass |

> El esquema se recrea en cada arranque (`drop-and-create` + `import.sql`). Solo dev.

### Conectarse a la BD en Docker

```bash
docker exec -it gf_users_db psql -U postgres -d users_db
# o desde el host:
psql -h localhost -p 5434 -U postgres -d users_db
```

## Ejecutar individualmente

```bash
# Modo dev (requiere la BD arriba)
docker compose up -d users-db     # desde la raíz del repo
cd ms-users && ./mvnw quarkus:dev

# Empaquetar y correr
./mvnw package
java -jar target/quarkus-app/quarkus-run.jar

# Solo dentro de Docker
docker compose up -d --build ms-users
```

## Variables de entorno (Docker)

| Variable                      | Valor por defecto |
|-------------------------------|-------------------|
| `QUARKUS_HTTP_PORT`           | 8085 |
| `QUARKUS_DATASOURCE_JDBC_URL` | `jdbc:postgresql://users-db:5432/users_db` |
| `QUARKUS_DATASOURCE_USERNAME` | postgres |
| `QUARKUS_DATASOURCE_PASSWORD` | postgres |

## Documentación de la API (Swagger / OpenAPI)

Disponible también en Docker (gracias a `quarkus.swagger-ui.always-include=true`):

- Swagger UI → <http://localhost:8085/q/swagger-ui>
- OpenAPI → <http://localhost:8085/q/openapi>

## Tests

```bash
./mvnw test
```

`UsuarioServiceTest` y `RolServiceTest` (Mockito, sin BD). El de roles verifica el
serializado/deserializado de los permisos a JSON, que es la lógica central del servicio.
