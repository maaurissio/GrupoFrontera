# ms-reportes — Exportación de Informes

Microservicio que genera **informes en PDF y Excel** combinando KPIs e inventario, y
mantiene el **historial de reportes generados**. Quarkus 3 / Java 21 / Maven.

## ¿Qué hace?

- Exporta un **informe completo** (KPIs + inventario de productos) en PDF o Excel, por
  sucursal o consolidado de todas.
- Exporta **solo inventario** (sin KPIs).
- Obtiene los datos en vivo desde `ms-kpis` y `ms-datos` vía **REST client**; si la
  llamada a productos falla, continúa sin inventario.
- Registra cada exportación en la tabla `reporte_generado` (tipo, formato, período,
  sucursal, favorito, fecha). **No guarda el archivo**: al "descargar" desde el historial
  se regenera al vuelo.

Formatos de salida:

- **PDF individual**: "Informe de Gestión por Sucursal" (landscape), tabla de KPIs +
  detalle de inventario.
- **PDF consolidado**: tabla comparativa de sucursales + inventario agrupado.
- **Excel** (individual y consolidado): pestañas `KPIs` e `Inventario`.

## Endpoints principales

| Método | Path | Descripción |
|--------|------|-------------|
| GET    | `/reportes/exportar?formato=pdf\|xlsx&periodo=YYYY-MM[&sucursalId=N]` | Informe KPIs + inventario |
| GET    | `/reportes/inventario?formato=pdf\|xlsx[&sucursalId=N]` | Solo inventario |
| GET    | `/reportes-guardados` | Historial |
| DELETE | `/reportes-guardados/{id}` | Eliminar del historial |
| PUT    | `/reportes-guardados/{id}/favorito` | Marcar/desmarcar favorito |

Puerto HTTP: **8087**.

## Base de datos

| Entorno         | URL JDBC                                          | Usuario / Clave |
|-----------------|--------------------------------------------------|-----------------|
| Docker compose  | `jdbc:postgresql://reportes-db:5432/reportes_db` | postgres / postgres |
| Dev local       | `jdbc:postgresql://localhost:5439/db_reportes`   | postgres / postgres |

Configurable por variables `DB_URL`, `DB_USER`, `DB_PASSWORD`.

> Esquema gestionado con **Flyway** (`migrate-at-start`). La tabla `reporte_generado`
> arranca vacía. No editar migraciones ya aplicadas.

### Conectarse a la BD en Docker

```bash
docker exec -it gf_reportes_db psql -U postgres -d reportes_db
# o desde el host:
psql -h localhost -p 5439 -U postgres -d reportes_db
```

## Dependencias de otros servicios

Necesita `ms-kpis` y `ms-datos` accesibles para obtener los datos del informe:

- `quarkus.rest-client.kpis-api.url` → `http://ms-kpis:8086` (dev: `http://localhost:8086`)
- `quarkus.rest-client.datos-api.url` → `http://ms-datos:8089` (dev: `http://localhost:8089`)

## Ejecutar individualmente

```bash
# Modo dev (requiere la BD arriba y, para datos reales, ms-kpis y ms-datos)
docker compose up -d reportes-db          # desde la raíz del repo
cd ms-reportes && ./mvnw quarkus:dev

# Empaquetar y correr
./mvnw package
java -jar target/quarkus-app/quarkus-run.jar

# Solo dentro de Docker
docker compose up -d --build ms-reportes
```

## Variables de entorno (Docker)

| Variable                      | Valor por defecto |
|-------------------------------|-------------------|
| `QUARKUS_HTTP_PORT`           | 8087 |
| `QUARKUS_DATASOURCE_JDBC_URL` | `jdbc:postgresql://reportes-db:5432/reportes_db` |
| `QUARKUS_REST_CLIENT_KPIS_API_URL`  | `http://ms-kpis:8086` |
| `QUARKUS_REST_CLIENT_DATOS_API_URL` | `http://ms-datos:8089` |

## Documentación de la API (Swagger / OpenAPI)

Disponible también en Docker (gracias a `quarkus.swagger-ui.always-include=true`):

- Swagger UI → <http://localhost:8087/q/swagger-ui>
- OpenAPI → <http://localhost:8087/q/openapi>

## Tests

```bash
./mvnw test
```

`ReportesServicioTest` (Mockito de los REST client), `ReporteGeneradoServiceTest`
(historial) y `ExportacionServicioTest` (generación real de PDF/Excel verificando la
firma `%PDF` y el contenido de las celdas con Apache POI). Corren con H2 en perfil
`%test`; no requieren PostgreSQL ni los otros microservicios.
