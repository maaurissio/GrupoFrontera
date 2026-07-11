# ms-kpis — Indicadores de Ventas e Inventario

Microservicio que calcula y expone los **KPIs por sucursal y período**: ventas, meta,
cumplimiento, ticket promedio e indicadores de inventario; y el **detalle de las
transacciones individuales** (boletas) detrás de esos agregados. Consume eventos de
**RabbitMQ**. Quarkus 3 / Java 21 / Maven.

## ¿Qué hace?

- Almacena indicadores agregados en dos tablas: `indicador_ventas` e `indicador_inventario`.
- Expone KPIs de una sucursal/período y un comparativo entre sucursales.
- Permite **edición manual de KPIs** (`PUT /kpis`): crea o actualiza el indicador de una
  sucursal+período y **recalcula automáticamente** `ticket_promedio` y
  `porcentaje_cumplimiento`.
- Almacena y expone **boletas individuales** (`venta` + `venta_item`): cada transacción
  con fecha/hora, canal, monto y sus líneas de producto — ver sección
  [Transacciones (boletas)](#transacciones-boletas) más abajo.
- Consume eventos de RabbitMQ para actualizar ventas y stock:
  - cola `venta.realizada` (exchange `ventas.exchange`)
  - cola `actualizacion.stock` (exchange `inventario.exchange`)

96 KPIs semilla (4 sucursales × 12 meses) con factor estacional, más el mes en curso.
Cada combinación sucursal+período tiene boletas sintéticas generadas por migración cuya
suma cuadra exacto con el agregado (ver [Migraciones](#migraciones)).

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

## Transacciones (boletas)

Entidades `Venta` (boleta: sucursal, período, fecha/hora, monto total, canal) y
`VentaItem` (línea de producto: código/nombre/categoría/precio **snapshot** al momento
de la venta — no se re-consulta ms-datos en cada lectura). Estilo Active Record, sin
capa Repository, igual que `IndicadorVentas`.

```json
// GET /ventas/{id}
{
  "id": 292,
  "sucursalRefId": 4,
  "periodo": "2026-07",
  "fechaHora": "2026-07-28T20:51:00",
  "montoTotal": 33746.47,
  "canal": "TIENDA",
  "items": [
    { "codigoProducto": "NB-014", "nombreProducto": "Notebook Core i3 8GB", "cantidad": 1, "precioUnitario": 14386.92, "subtotal": 14386.92 },
    { "codigoProducto": "BAR-018", "nombreProducto": "Barra de Sonido", "cantidad": 1, "precioUnitario": 19359.55, "subtotal": 19359.55 }
  ]
}
```

**Importante:** `/ventas` está montado en un path **raíz separado**, no anidado bajo
`/kpis`. Un REST client que herede el `@Path("/kpis")` del cliente existente y le agregue
`/ventas` apuntará mal (a `/kpis/ventas`, que no existe). El bff y ms-reportes ya usan un
client dedicado (`VentaClient` / `ClienteVentas`) para esto.

## Endpoints principales

| Método | Path | Descripción |
|--------|------|-------------|
| GET    | `/kpis` | KPIs de una sucursal/período |
| GET    | `/kpis/comparativo` | Comparativo entre sucursales |
| PUT    | `/kpis` | Crear/actualizar KPIs (recálculo automático) |
| GET    | `/ventas?sucursalId=&periodoDesde=&periodoHasta=&page=&size=` | Lista paginada de boletas (`sucursalId` opcional, rango de período obligatorio) |
| GET    | `/ventas/{id}` | Detalle de una boleta con sus líneas de producto |

Puerto HTTP: **8086**.

## Base de datos

| Entorno         | URL JDBC                                    | Usuario / Clave |
|-----------------|---------------------------------------------|-----------------|
| Docker compose  | `jdbc:postgresql://kpis-db:5432/kpis_db`    | postgres / postgres |
| Dev local       | `jdbc:postgresql://localhost:5438/kpis_db`  | postgres / postgres |

> Esquema gestionado con **Flyway** (`migrate-at-start`). Semillas automáticas con BD
> nueva. No editar migraciones ya aplicadas.

### Migraciones

| Versión | Contenido |
|---------|-----------|
| V1 | Tablas `indicador_ventas`, `indicador_inventario` |
| V2–V3 | Seed inicial + corrección de montos |
| V4 | 96 KPIs semilla (4 sucursales × 12 meses) con factor estacional |
| V5 | Tablas `venta` y `venta_item` |
| V6 | Genera boletas sintéticas para los 96 combos de V4 (PL/pgSQL, cuadra exacto con los agregados) |
| V7 | Agrega el período del mes en curso (2026-07), mismo patrón determinista de V4 |
| V8 | Boletas para el período agregado en V7, mismo método de V6 |

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
