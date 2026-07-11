# Grupo Frontera — Plataforma de Monitoreo Retail

Plataforma de monitoreo para una empresa retail multi-sucursal (Grupo Cordillera).
Permite gestionar usuarios, roles y sucursales; administrar el catálogo de productos
e inventario; visualizar KPIs de ventas por sucursal/período junto con el detalle de
cada transacción (boleta); y exportar informes en PDF y Excel.

## Arquitectura

El sistema sigue un patrón **BFF + microservicios**. Cada microservicio es un proyecto
independiente (Quarkus 3 / Java 21 / Maven) con su **propia base de datos PostgreSQL**.
Las relaciones entre servicios son **lógicas, no FK reales**: una entidad referencia a
otra por su ID (ej. `sucursalRefId`), nunca con `@ManyToOne` cruzando servicios.

```
                    ┌─────────────┐
                    │   front     │  React 19 + Vite (5173)
                    └──────┬──────┘
                           │ HTTP/REST
                    ┌──────▼──────┐
                    │     bff     │  Backend-for-Frontend (8090)
                    └──────┬──────┘
        ┌─────────┬───────┼────────┬──────────┐
   ┌────▼───┐ ┌───▼───┐ ┌─▼────┐ ┌─▼────┐ ┌───▼──────┐
   │ms-auth │ │ms-user│ │ms-dat│ │ms-kpi│ │ms-reportes│
   │ (8088) │ │(8085) │ │(8089)│ │(8086)│ │  (8087)   │
   └───┬────┘ └───┬───┘ └──┬───┘ └──┬───┘ └────┬──────┘
   ┌───▼───┐ ┌────▼──┐ ┌───▼──┐ ┌───▼──┐ ┌─────▼─────┐
   │auth_db│ │users_db│ │datos_│ │kpis_ │ │reportes_db│
   └───────┘ └────────┘ │  db  │ │ db   │ └───────────┘
                        └──────┘ └──────┘
```

| Directorio    | Rol |
|---------------|-----|
| `ms-auth`     | Autenticación JWT (HS384), BCrypt, refresh tokens |
| `ms-users`    | Usuarios, roles (permisos por módulo) y sucursales |
| `ms-datos`    | Catálogo de productos y sucursales |
| `ms-kpis`     | KPIs de ventas/inventario por sucursal y período; detalle de transacciones (boletas); consume RabbitMQ |
| `ms-reportes` | Exportación PDF/Excel (KPIs + inventario + transacciones), historial de reportes |
| `bff`         | Backend-for-frontend: agrega y orquesta los microservicios |
| `front`       | SPA React 19 + Vite + TypeScript |

Paquete Java base: `com.grupofrontera.ms<nombre>`. No hay POM raíz: cada servicio se
construye desde su propio directorio.

## Puertos

| Servicio      | HTTP | BD (host) | BD docker-compose |
|---------------|------|-----------|-------------------|
| `ms-auth`     | 8088 | 5435      | auth_db           |
| `ms-users`    | 8085 | 5434      | users_db          |
| `ms-datos`    | 8089 | 5437      | datos_db          |
| `ms-kpis`     | 8086 | 5438      | kpis_db           |
| `ms-reportes` | 8087 | 5439      | reportes_db       |
| `bff`         | 8090 | —         | —                 |
| `front`       | 5173 | —         | —                 |
| RabbitMQ      | 5672 / 15672 (UI) | — | guest/guest    |

> Puerto 8080 → Jenkins. Puerto 8082 → SSRS. Puerto 5432 se evita por conflicto con
> PostgreSQL local. No revertir estos puertos.

## Arranque rápido (todo en Docker)

Requiere únicamente **Docker** y **Docker Compose** (no necesitas Java ni Node: cada
servicio se compila dentro de su imagen vía build multi-stage).

```bash
# Levantar todo el stack (build + run)
docker compose up -d --build

# Ver logs de todo
docker compose logs -f

# Apagar
docker compose down

# Apagar y borrar los datos de las BD (volúmenes)
docker compose down -v
```

Accesos una vez arriba:

- Frontend: <http://localhost:5173>
- BFF: <http://localhost:8090>
- RabbitMQ UI: <http://localhost:15672> (guest / guest)

El frontend usa rutas relativas hacia el BFF (proxeadas por nginx), así que también
funciona accediendo desde otra máquina de la red (`http://<ip-del-servidor>:5173`), sin
necesidad de reconfigurar nada.

### Documentación de la API (Swagger / OpenAPI)

Todos los backends exponen Swagger UI y el documento OpenAPI en las rutas por defecto de
Quarkus (también en Docker):

- Swagger UI → `http://localhost:<puerto>/q/swagger-ui`
- OpenAPI → `http://localhost:<puerto>/q/openapi`

| Servicio | Swagger UI |
|----------|-----------|
| ms-auth     | <http://localhost:8088/q/swagger-ui> |
| ms-users    | <http://localhost:8085/q/swagger-ui> |
| ms-datos    | <http://localhost:8089/q/swagger-ui> |
| ms-kpis     | <http://localhost:8086/q/swagger-ui> |
| ms-reportes | <http://localhost:8087/q/swagger-ui> |
| bff         | <http://localhost:8090/q/swagger-ui> |

### Registrar credenciales tras un reset de BD

`ms-auth` y `ms-users` recrean su esquema en cada arranque (modo dev). Tras un reset hay
que registrar los usuarios:

```bash
curl -X POST http://localhost:8088/auth/register -H "Content-Type: application/json" \
  -d '{"usuarioId":"d1111111-1111-1111-1111-111111111111","email":"admin@cordillera.cl","password":"Admin1234!"}'
curl -X POST http://localhost:8088/auth/register -H "Content-Type: application/json" \
  -d '{"usuarioId":"e2222222-2222-2222-2222-222222222222","email":"soporte@cordillera.cl","password":"Soporte1234!"}'
curl -X POST http://localhost:8088/auth/register -H "Content-Type: application/json" \
  -d '{"usuarioId":"f3333333-3333-3333-3333-333333333333","email":"gerente@cordillera.cl","password":"Gerente1234!"}'
```

| Email                 | Password     | Rol     |
|-----------------------|--------------|---------|
| admin@cordillera.cl   | Admin1234!   | ADMIN   |
| soporte@cordillera.cl | Soporte1234! | SOPORTE |
| gerente@cordillera.cl | Gerente1234! | GERENTE |

## Desarrollo local (servicio por servicio)

Para iterar sobre un solo servicio con recarga en caliente, levanta primero **solo la
infraestructura** (bases de datos + RabbitMQ) y corre ese servicio con Quarkus Dev:

```bash
# Solo infraestructura en Docker
docker compose up -d auth-db users-db datos-db kpis-db reportes-db rabbitmq

# Un microservicio en modo dev (desde su carpeta)
cd ms-datos && ./mvnw quarkus:dev

# Frontend en modo dev
cd front && npm install && npm run dev
```

Cada `README.md` por servicio detalla puertos, variables y cómo conectarse a su BD.

## Conexión a las bases de datos (Docker)

Todas las BD en Docker usan usuario/clave `postgres` / `postgres`. Cada una expone un
puerto distinto en el host:

```bash
# Desde el contenedor
docker exec -it gf_datos_db psql -U postgres -d datos_db

# Desde el host (con cliente psql instalado)
psql -h localhost -p 5437 -U postgres -d datos_db   # datos
psql -h localhost -p 5435 -U postgres -d auth_db     # auth
psql -h localhost -p 5434 -U postgres -d users_db    # users
psql -h localhost -p 5438 -U postgres -d kpis_db     # kpis
psql -h localhost -p 5439 -U postgres -d reportes_db # reportes
```

Contenedores de BD: `gf_auth_db`, `gf_users_db`, `gf_datos_db`, `gf_kpis_db`,
`gf_reportes_db`. Mensajería: `gf_rabbitmq`.

## Persistencia de datos

- **ms-auth / ms-users**: esquema `drop-and-create` + `import.sql` (se recrea en cada
  arranque). Solo para desarrollo.
- **ms-datos / ms-kpis / ms-reportes**: migraciones **Flyway** (`migrate-at-start`).
  Nunca editar una migración aplicada; agregar una nueva `V#__*.sql`. Las semillas de
  productos y KPIs se aplican solas con BD nueva.

## Tests

Cada servicio trae su propio set de tests (~10 por componente, los más relevantes):

```bash
cd <servicio> && ./mvnw test   # microservicios y bff
cd front && npm test           # vitest + cobertura
```

Los tests unitarios de los microservicios corren sin BD (Mockito) o con H2 en memoria;
no necesitas levantar Docker para ejecutarlos.

## Stack tecnológico

- **Backend**: Java 21, Quarkus 3, Maven, Hibernate ORM con Panache, PostgreSQL 16,
  Flyway, RabbitMQ (SmallRye Reactive Messaging), JWT, BCrypt.
- **Frontend**: React 19, Vite, TypeScript, MapLibre GL, lucide-react.
- **Infra**: Docker / Docker Compose, nginx (sirve el front), Jenkins (CI).
