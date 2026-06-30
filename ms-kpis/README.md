# ms-kpis — Indicadores de Ventas e Inventario

Microservicio que calcula y expone los **KPIs por sucursal y período**: ventas, meta,
cumplimiento, ticket promedio e indicadores de inventario. Consume eventos de **RabbitMQ**.
Quarkus 3 / Java 21 / Maven.

## ¿Qué hace?

- Almacena indicadores en dos tablas: `indicador_ventas` e `indicador_inventario`.
- Expone KPIs de una sucursal/período y un comparativo entre sucursales.
- Permite **edición manual de KPIs** (`PUT /kpis`): crea o actualiza el indicador de una
  sucursal+período y **recalcula automáticamente** `ticket_promedio` y
  `porcentaje_cumplimiento`.
- Consume eventos de RabbitMQ para actualizar ventas y stock:
  - cola `venta.realizada` (exchange `ventas.exchange`)
  - cola `actualizacion.stock` (exchange `inventario.exchange`)

96 KPIs semilla (4 sucursales × 12 meses) con factor estacional.

## Edición manual de KPIs (`PUT /kpis`)

```json
{
  "sucursalId": 1,
  "periodo": "2026-06",
  "totalVentas": 500000,
  "cantidadTransacciones": 100,
  "metaMensual": 600000
}
```

Disponible para roles ADMIN y GERENTE (validado en el frontend).

## Endpoints principales

| Método | Path | Descripción |
|--------|------|-------------|
| GET    | `/kpis` | KPIs de una sucursal/período |
| GET    | `/kpis/comparativo` | Comparativo entre sucursales |
| PUT    | `/kpis` | Crear/actualizar KPIs (recálculo automático) |

Puerto HTTP: **8086**.

## Base de datos

| Entorno         | URL JDBC                                    | Usuario / Clave |
|-----------------|---------------------------------------------|-----------------|
| Docker compose  | `jdbc:postgresql://kpis-db:5432/kpis_db`    | postgres / postgres |
| Dev local       | `jdbc:postgresql://localhost:5438/kpis_db`  | postgres / postgres |

> Esquema gestionado con **Flyway** (`migrate-at-start`). Semillas automáticas con BD
> nueva. No editar migraciones ya aplicadas.

### Conectarse a la BD en Docker

```bash
docker exec -it gf_kpis_db psql -U postgres -d kpis_db
# o desde el host:
psql -h localhost -p 5438 -U postgres -d kpis_db
```

## Ejecutar individualmente

```bash
# Modo dev (requiere BD + RabbitMQ arriba)
docker compose up -d kpis-db rabbitmq     # desde la raíz del repo
cd ms-kpis && ./mvnw quarkus:dev

# Empaquetar y correr
./mvnw package
java -jar target/quarkus-app/quarkus-run.jar

# Solo dentro de Docker
docker compose up -d --build ms-kpis
```

## Variables de entorno (Docker)

| Variable                      | Valor por defecto |
|-------------------------------|-------------------|
| `QUARKUS_HTTP_PORT`           | 8086 |
| `QUARKUS_DATASOURCE_JDBC_URL` | `jdbc:postgresql://kpis-db:5432/kpis_db` |
| `QUARKUS_DATASOURCE_USERNAME` | postgres |
| `QUARKUS_DATASOURCE_PASSWORD` | postgres |
| `RABBITMQ_HOST`               | rabbitmq |
| `RABBITMQ_PORT`               | 5672 |

RabbitMQ UI: <http://localhost:15672> (guest / guest).

## Documentación de la API (Swagger / OpenAPI)

Disponible también en Docker (gracias a `quarkus.swagger-ui.always-include=true`):

- Swagger UI → <http://localhost:8086/q/swagger-ui>
- OpenAPI → <http://localhost:8086/q/openapi>

## Tests

```bash
./mvnw test
```

`KpisServicioTest` (Mockito + `mockStatic`, H2 en perfil `%test` con Flyway deshabilitado)
cubre el cálculo y la edición manual de KPIs. No requiere PostgreSQL ni RabbitMQ.
