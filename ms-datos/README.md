# ms-datos — Catálogo de Productos y Sucursales

Microservicio que administra el **catálogo de productos** (inventario) y las
**sucursales** de la cadena. Quarkus 3 / Java 21 / Maven.

## ¿Qué hace?

- CRUD de **productos**: código, nombre, sucursal, categoría, stock, stock mínimo,
  precio, fecha de actualización de stock y soft delete (`activo`).
  - Categorías: `ELECTRODOMESTICO, TV, MOVIL, CONSOLA, COMPUTACION, AUDIO, ACCESORIO, OTRO`.
  - Validación de código único por sucursal (409 si se duplica).
  - Ajuste de stock con validación (no permite stock negativo).
  - Importación masiva (insert-only) y filtros por sucursal, categoría, texto y estado.
- CRUD de **sucursales**: código, nombre, ciudad, coordenadas, dirección, año de apertura
  y habilitación.

IDs numéricos (`Long`). 4 sucursales semilla (Don Raucho/Angol, Jurel San Jose/Coronel,
Hogar Central/Santiago, TecnoSur/Puerto Montt) + 48 productos.

## Endpoints principales

| Método      | Path | Descripción |
|-------------|------|-------------|
| GET         | `/productos` | Listar con filtros (`sucursalId`, `categoria`, `q`, `activo`) |
| GET/POST/PUT| `/productos/{id}` | Detalle / crear / editar |
| PUT         | `/productos/{id}/estado` | Activar/desactivar |
| POST        | `/productos/importar` | Importación masiva |
| GET         | `/productos/categorias` | Catálogo de categorías |
| GET/POST/PUT| `/sucursales` | CRUD de sucursales |

Puerto HTTP: **8089**.

## Base de datos

| Entorno         | URL JDBC                                          | Usuario / Clave |
|-----------------|--------------------------------------------------|-----------------|
| Docker compose  | `jdbc:postgresql://datos-db:5432/datos_db`       | postgres / postgres |
| Dev local       | `jdbc:postgresql://localhost:5437/grupofrontera` | postgres / postgres |

Configurable por variables `DB_URL`, `DB_USER`, `DB_PASSWORD`.

> Esquema gestionado con **Flyway** (`migrate-at-start`). Las semillas se aplican solas
> con una BD nueva. **Nunca editar una migración aplicada**: agregar una nueva `V#__*.sql`.

### Conectarse a la BD en Docker

```bash
docker exec -it gf_datos_db psql -U postgres -d datos_db
# o desde el host:
psql -h localhost -p 5437 -U postgres -d datos_db
```

## Ejecutar individualmente

```bash
# Modo dev (requiere la BD arriba)
docker compose up -d datos-db     # desde la raíz del repo
cd ms-datos && ./mvnw quarkus:dev

# Empaquetar y correr
./mvnw package
java -jar target/quarkus-app/quarkus-run.jar

# Solo dentro de Docker
docker compose up -d --build ms-datos
```

## Variables de entorno (Docker)

| Variable                      | Valor por defecto |
|-------------------------------|-------------------|
| `QUARKUS_HTTP_PORT`           | 8089 |
| `QUARKUS_DATASOURCE_JDBC_URL` / `DB_URL` | `jdbc:postgresql://datos-db:5432/datos_db` |
| `QUARKUS_DATASOURCE_USERNAME` / `DB_USER` | postgres |
| `QUARKUS_DATASOURCE_PASSWORD` / `DB_PASSWORD` | postgres |

## Documentación de la API (Swagger / OpenAPI)

Disponible también en Docker (gracias a `quarkus.swagger-ui.always-include=true`):

- Swagger UI → <http://localhost:8089/q/swagger-ui>
- OpenAPI → <http://localhost:8089/q/openapi>

## Tests

```bash
./mvnw test
```

`ProductoServiceTest` y `SucursalServiceTest` corren con **H2 en memoria**
(`@QuarkusTest`), no requieren PostgreSQL. Este servicio usa `quarkus-jacoco` para
cobertura (el agente JaCoCo estándar es incompatible con el bytecode de Panache).
