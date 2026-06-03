# Setup — ms-auth (nuevo PC / primer clone)

## Requisitos previos

- Java 21
- Maven (o usar `mvnw` incluido)
- Docker Desktop corriendo

---

## Opción A — Solo la BD en Docker, app en local (desarrollo)

```powershell
docker-compose up -d db-auth
./mvnw quarkus:dev
```

La app queda disponible en:
- API: `http://localhost:8081`
- Swagger UI: `http://localhost:8081/swagger-ui`

---

## Opción B — Todo en Docker (BD + app)

```powershell
./mvnw package -DskipTests
docker-compose up -d
```

---

## Acceder a la base de datos directamente

```powershell
docker exec -it pg-auth psql -U usuario_cordillera -d db_auth
```

---

## Datos de conexión (para clientes como DBeaver / TablePlus)

| Campo    | Valor                |
|----------|----------------------|
| Host     | `localhost`          |
| Puerto   | `5435`               |
| Base     | `db_auth`            |
| Usuario  | `usuario_cordillera` |
| Password | `cordillera_pass`    |

---

## Endpoints disponibles

| Método | Ruta             | Descripción                              |
|--------|------------------|------------------------------------------|
| POST   | /auth/register   | Registrar credenciales (llamado por BFF) |
| POST   | /auth/login      | Login → accessToken + refreshToken       |
| POST   | /auth/refresh    | Renovar tokens                           |
| POST   | /auth/logout     | Invalidar refreshToken → HTTP 204        |
| POST   | /auth/validate   | Validar JWT (header Authorization)       |

---

## Apagar contenedores

```powershell
docker-compose down       # apaga sin borrar datos
docker-compose down -v    # apaga y elimina datos
```
