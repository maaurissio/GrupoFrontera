# bff — Backend-for-Frontend

Capa de **agregación y orquestación** entre el frontend y los microservicios. El front
habla **solo** con el BFF; el BFF reparte y combina las llamadas hacia `ms-auth`,
`ms-users`, `ms-datos`, `ms-kpis` y `ms-reportes`. Quarkus 3 / Java 21 / Maven.

## ¿Qué hace?

- Expone una API única bajo `/api/bff/*` para el frontend.
- Propaga la autenticación (login/refresh/logout contra `ms-auth`).
- Compone respuestas que requieren varios servicios (ej. alta de usuario = `ms-users` +
  `ms-auth`; detalle de sucursal = datos de `ms-datos`, `ms-users` y `ms-kpis`).
- Maneja **CORS** para el front y propaga los errores 4xx de los servicios upstream
  (`ClientExceptionMapper`).

No tiene base de datos propia.

## Endpoints (selección)

| Método | Path | Upstream |
|--------|------|----------|
| POST   | `/api/bff/auth/login` · `/refresh` · `/logout` | ms-auth |
| GET/POST/PUT | `/api/bff/usuarios` (+ `/{id}`, activar/desactivar) | ms-users (+ ms-auth) |
| GET/POST | `/api/bff/roles` | ms-users |
| GET/POST/PUT | `/api/bff/sucursales` (+ estado, usuarios) | ms-datos / ms-users |
| GET/PUT | `/api/bff/kpis` (+ `/comparativo`) | ms-kpis |
| GET/POST/PUT | `/api/bff/productos` (+ estado, importar, categorías) | ms-datos |
| GET    | `/api/bff/reportes/exportar` · `/inventario` | ms-reportes |
| GET/DELETE/PUT | `/api/bff/reportes-guardados` (+ favorito) | ms-reportes |

Puerto HTTP: **8090**.

## Configuración de upstreams

Cada microservicio se configura como REST client. URLs por variable de entorno (valor por
defecto = localhost para dev):

| Variable          | Docker compose          | Dev local |
|-------------------|-------------------------|-----------|
| `MS_AUTH_URL`     | `http://ms-auth:8088`   | `http://localhost:8088` |
| `MS_USERS_URL`    | `http://ms-users:8085`  | `http://localhost:8085` |
| `MS_DATOS_URL`    | `http://ms-datos:8089`  | `http://localhost:8089` |
| `MS_KPIS_URL`     | `http://ms-kpis:8086`   | `http://localhost:8086` |
| `MS_REPORTES_URL` | `http://ms-reportes:8087` | `http://localhost:8087` |

CORS: habilitado para `http://localhost:5173`, con `Content-Disposition` expuesto (para la
descarga de informes).

## Ejecutar individualmente

```bash
# Modo dev (requiere los microservicios upstream accesibles)
cd bff && ./mvnw quarkus:dev

# Empaquetar y correr
./mvnw package
java -jar target/quarkus-app/quarkus-run.jar

# Solo dentro de Docker
docker compose up -d --build bff
```

Para desarrollo aislado puedes levantar los microservicios con `docker compose up -d
ms-auth ms-users ms-datos ms-kpis ms-reportes` y correr el BFF en modo dev apuntando a
localhost.

## Documentación de la API (Swagger / OpenAPI)

Disponible también en Docker (gracias a `quarkus.swagger-ui.always-include=true`):

- Swagger UI → <http://localhost:8090/q/swagger-ui>
- OpenAPI → <http://localhost:8090/q/openapi>

## Tests

```bash
./mvnw test
```

`BffResourceTest` (`@QuarkusTest`) y `ClientExceptionMapperTest` (propagación de errores
upstream).
