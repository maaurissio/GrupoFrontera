# ms-auth — Servicio de Autenticación

Microservicio responsable de la **autenticación y emisión de tokens** del sistema Grupo
Frontera. Quarkus 3 / Java 21 / Maven.

## ¿Qué hace?

- Registra credenciales (email + contraseña hasheada con **BCrypt**).
- Valida el login y emite un **access token JWT** (firmado con HS384) y un
  **refresh token** persistido en BD.
- Rota refresh tokens y permite cerrar sesión (invalidación).
- Valida tokens entrantes y expone los claims (usuarioId, email).
- Activa/desactiva credenciales; al desactivar invalida todos los refresh tokens.

Guarda solo datos de credenciales: referencia al usuario por `usuarioRefId` (UUID), sin
FK hacia `ms-users`.

## Endpoints principales

| Método | Path             | Descripción |
|--------|------------------|-------------|
| POST   | `/auth/register` | Crea una credencial |
| POST   | `/auth/login`    | Login → access + refresh token |
| POST   | `/auth/refresh`  | Rota el refresh token y emite uno nuevo |
| POST   | `/auth/logout`   | Invalida el refresh token |
| POST   | `/auth/validate` | Valida un access token y devuelve sus claims |

Puerto HTTP: **8088**.

## Base de datos

| Entorno         | URL JDBC                                    | Usuario / Clave |
|-----------------|--------------------------------------------|-----------------|
| Docker compose  | `jdbc:postgresql://auth-db:5432/auth_db`   | postgres / postgres |
| Dev local       | `jdbc:postgresql://localhost:5435/db_auth` | usuario_cordillera / cordillera_pass |

> El esquema se recrea en cada arranque (`drop-and-create` + `import.sql`). Solo dev.

### Conectarse a la BD en Docker

```bash
docker exec -it gf_auth_db psql -U postgres -d auth_db
# o desde el host:
psql -h localhost -p 5435 -U postgres -d auth_db
```

## Ejecutar individualmente

```bash
# Modo dev con recarga en caliente (requiere la BD arriba)
docker compose up -d auth-db      # desde la raíz del repo
cd ms-auth && ./mvnw quarkus:dev

# Empaquetar y correr
./mvnw package
java -jar target/quarkus-app/quarkus-run.jar

# Solo dentro de Docker
docker compose up -d --build ms-auth
```

Tras levantar el servicio con BD nueva, registra las credenciales base (ver README
global).

## Variables de entorno (Docker)

| Variable                      | Valor por defecto |
|-------------------------------|-------------------|
| `QUARKUS_HTTP_PORT`           | 8088 |
| `QUARKUS_DATASOURCE_JDBC_URL` | `jdbc:postgresql://auth-db:5432/auth_db` |
| `QUARKUS_DATASOURCE_USERNAME` | postgres |
| `QUARKUS_DATASOURCE_PASSWORD` | postgres |

El secreto JWT y la expiración se configuran en `application.properties`
(`auth.jwt.secret`, `auth.jwt.expiration-hours`). **Cambiar el secreto en producción.**

## Documentación de la API (Swagger / OpenAPI)

Disponible también en Docker (gracias a `quarkus.swagger-ui.always-include=true`):

- Swagger UI → <http://localhost:8088/q/swagger-ui>
- OpenAPI → <http://localhost:8088/q/openapi>

## Tests

```bash
./mvnw test
```

`AuthServiceTest` (Mockito, sin BD) cubre registro, login, refresh, logout, cambio de
estado y validación de tokens. No necesita la base de datos levantada.
