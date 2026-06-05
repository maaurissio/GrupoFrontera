# Setup — ms-users (nuevo PC / primer clone)

## Requisitos previos

- Java 21
- Maven (o usar `mvnw` incluido)
- Docker Desktop corriendo

---

## Opción A — Solo la BD en Docker, app en local (desarrollo)

Útil para desarrollo con live reload (`quarkus:dev`).

### 1. Levantar la base de datos

```powershell
docker-compose up -d db-users
```

> **Importante:** nunca usar `docker-compose up -d` a secas al clonar el repo — intentará buildear la imagen de la app desde `target/`, que no existe aún, y fallará.

### 2. Correr la app en modo desarrollo

```powershell
./mvnw quarkus:dev
```

La app queda disponible en:
- API: `http://localhost:8082`
- Swagger UI: `http://localhost:8082/swagger-ui`
- Dev UI: `http://localhost:8082/q/dev/`

---

## Opción B — Todo en Docker (BD + microservicio)

### 1. Compilar el JAR primero

```powershell
./mvnw package -DskipTests
```

### 2. Levantar ambos contenedores

```powershell
docker-compose up -d
```

Esto levanta `db-users` (PostgreSQL) y `ms-users` (la app) en la misma red Docker.

La app queda disponible en:
- API: `http://localhost:8082`
- Swagger UI: `http://localhost:8082/swagger-ui`

> La app se comunica con la BD usando el hostname interno `db-users` (no `localhost`).
> Eso ya está configurado en el `docker-compose.yml` via `QUARKUS_DATASOURCE_JDBC_URL`.

---

## Acceder a la base de datos directamente

Con el contenedor corriendo:

```powershell
docker exec -it pg-users psql -U usuario_cordillera -d db_users
```

Comandos útiles dentro de psql:

```sql
\dt                     -- listar tablas
SELECT * FROM usuarios; -- consultar datos
\q                      -- salir
```

---

## Datos de conexión (para clientes como DBeaver / TablePlus)

| Campo    | Valor                |
|----------|----------------------|
| Host     | `localhost`          |
| Puerto   | `5434`               |
| Base     | `db_users`           |
| Usuario  | `usuario_cordillera` |
| Password | `cordillera_pass`    |

---

## Correr los tests

Con la base de datos levantada (cualquier opción):

```powershell
./mvnw test
```

---

## Apagar contenedores

```powershell
docker-compose down          # apaga sin borrar datos
docker-compose down -v       # apaga y elimina datos persistidos
```
