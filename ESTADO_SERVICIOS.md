# Estado de servicios — Grupo Frontera

Última actualización: 2026-06-10

---

## Resumen rápido

| Servicio    | Puerto asignado | Estado       | Observación |
|-------------|----------------|--------------|-------------|
| ms-auth     | 8081           | ✅ Operativo  | — |
| ms-users    | **8085**       | ✅ Operativo  | Puerto cambiado (ver conflictos) |
| ms-datos    | **8083**       | ❌ No arranca | Requiere acciones manuales (ver abajo) |
| ms-kpis     | 8086           | ⚠️ Parcial   | Arranca, pero sin datos de KPI |
| BFF         | 8090           | ✅ Operativo  | — |
| Frontend    | 5173           | ✅ Operativo  | `npm run dev` desde `front/` |

---

## Conflictos de puertos encontrados en esta máquina

| Puerto | Ocupado por                     | Solución aplicada |
|--------|---------------------------------|-------------------|
| 8080   | **Jenkins** (PID 10668, `java`) | ms-datos movido a 8083 |
| 8082   | **SSRS** (`RSHostingService`, Windows `PID 4`, HTTP.sys/NTLM) | ms-users movido a 8085 |
| 5432   | **PostgreSQL local** (PID 10064) + Docker compiten | pg-datos movido a puerto 5437 |

---

## Cambios de configuración realizados

### `ms-users/src/main/resources/application.properties`
- `quarkus.http.port=8082` → **8085**

### `ms-datos/src/main/resources/application.properties`
- `quarkus.http.port=${PORT:8080}` → **8083**
- `quarkus.datasource.jdbc.url` → **5432 → 5437** (pg-datos Docker en 5437)

### `bff/src/main/resources/application.properties`
- `ms-users/mp-rest/url` → **8082 → 8085**
- `ms-datos/mp-rest/url` → **8080 → 8083**
- Añadido: `quarkus.rest-client.disable-default-mapper=true`
- Corregidos (estaban invertidos): ms-auth 8080→8081, ms-users 8081→8082 (luego 8085)

### `bff/src/main/java/com/grupofrontera/bff/exception/ClientExceptionMapper.java` *(nuevo)*
- Propaga correctamente los códigos 4xx de los microservicios (antes todos devolvían 500)

---

## ms-datos — Problema pendiente

### Síntoma
Flyway no puede conectarse al contenedor `pg-datos`:
```
FlywaySqlUnableToConnectToDbException: Unable to obtain connection from database:
FATAL: la autentificación password falló para el usuario 'postgres'
```
Y luego el recovery de dev mode falla porque 8080 (Jenkins) está ocupado:
```
QuarkusBindException: Port already bound: 8080: Address already in use
```

### Causa raíz
El container `pg-datos` fue recreado en el puerto **5437** para evitar conflicto con el PostgreSQL local (puerto 5432). El `application.properties` de ms-datos ya apunta a 5437, pero la ventana de PowerShell que arrancó ms-datos puede estar usando la configuración anterior.

### Pasos para levantarlo manualmente
```powershell
# 1. Verificar que el contenedor esté corriendo en 5437
docker ps | Select-String "pg-datos"
# Debe mostrar: 0.0.0.0:5437->5432/tcp

# 2. Probar conexión
docker exec pg-datos psql -U postgres -d grupofrontera -c "SELECT 1;"

# 3. Levantar ms-datos (en una terminal separada)
cd C:\Users\CO-Alumno\Desktop\GrupoFrontera\ms-datos
.\mvnw.cmd quarkus:dev -Dquarkus.live-reload.port=8193

# El flag -Dquarkus.live-reload.port=8193 evita el conflicto con Jenkins en 8080
```

---

## ms-kpis — Sin datos de KPI

### Síntoma
El endpoint `/kpis?sucursalId=X&periodo=YYYY-MM` devuelve:
```json
{"error": "No hay datos de KPIs para la sucursal 1 en el periodo 2026-06"}
```

### Causa raíz
ms-kpis recibe KPIs exclusivamente via **RabbitMQ** (eventos `venta.realizada` y `actualizacion.stock`). El servicio arranca bien y RabbitMQ está corriendo (puerto 5672), pero ningún evento ha sido publicado.

### Opciones para tener datos de KPI
**Opción A (recomendada para dev):** Insertar datos directamente en la BD:
```powershell
docker exec -it pg-kpis psql -U postgres -d kpis_db -c "
INSERT INTO kpis (sucursal_id, periodo, total_ventas, cantidad_transacciones, ticket_promedio, meta_mensual, porcentaje_cumplimiento, productos_bajo_minimo, rotacion_promedio, dias_sin_reposicion)
VALUES (1, '2026-06', 15000000, 320, 46875, 18000000, 83.3, 7, 4.2, 3);
"
```

**Opción B:** Publicar un evento de prueba a RabbitMQ via la interfaz web:
- URL: `http://localhost:15672` (guest/guest)
- Exchange: `ventas.exchange`, routing key: `venta.realizada`

---

## ms-auth — Credenciales semilla

Los tres usuarios del `import.sql` de ms-users **no tienen credenciales** en ms-auth (el seed de ms-auth está vacío por diseño). Se registraron manualmente en esta sesión:

| Email                  | Contraseña      | Rol     |
|------------------------|-----------------|---------|
| admin@cordillera.cl    | Admin1234!      | ADMIN   |
| soporte@cordillera.cl  | Soporte1234!    | SOPORTE |
| gerente@cordillera.cl  | Gerente1234!    | GERENTE |

> **Nota:** ms-auth usa `drop-and-create` al iniciar. Si se reinicia ms-auth, las credenciales se pierden y hay que registrarlas de nuevo:
> ```bash
> curl -X POST http://localhost:8081/auth/register \
>   -H "Content-Type: application/json" \
>   -d '{"usuarioId":"d1111111-1111-1111-1111-111111111111","email":"admin@cordillera.cl","password":"Admin1234!"}'
> ```

---

## Contenedores Docker activos

| Contenedor  | Puerto host | BD          |
|-------------|------------|-------------|
| pg-auth     | 5435       | db_auth     |
| pg-users    | 5434       | db_users    |
| pg-datos    | **5437**   | grupofrontera |
| pg-kpis     | 5438       | kpis_db     |
| rabbitmq    | 5672/15672 | —           |

Para iniciarlos todos de nuevo si Docker se reinicia:
```bash
docker start pg-auth pg-users pg-datos pg-kpis rabbitmq
```

---

## Cómo levantar todo desde cero

```powershell
# 1. Contenedores Docker
docker start pg-auth pg-users pg-datos pg-kpis rabbitmq

# 2. ms-auth (terminal 1)
cd C:\Users\CO-Alumno\Desktop\GrupoFrontera\ms-auth
.\mvnw.cmd quarkus:dev

# 3. ms-users (terminal 2)
cd C:\Users\CO-Alumno\Desktop\GrupoFrontera\ms-users
.\mvnw.cmd quarkus:dev

# 4. ms-datos (terminal 3)
cd C:\Users\CO-Alumno\Desktop\GrupoFrontera\ms-datos
.\mvnw.cmd quarkus:dev -Dquarkus.live-reload.port=8193

# 5. ms-kpis (terminal 4)
cd C:\Users\CO-Alumno\Desktop\GrupoFrontera\ms-kpis
.\mvnw.cmd quarkus:dev

# 6. BFF (terminal 5)
cd C:\Users\CO-Alumno\Desktop\GrupoFrontera\bff
.\mvnw.cmd quarkus:dev

# 7. Frontend (terminal 6)
cd C:\Users\CO-Alumno\Desktop\GrupoFrontera\front
npm run dev

# 8. Registrar credenciales (solo si ms-auth se reinició)
curl -X POST http://localhost:8081/auth/register -H "Content-Type: application/json" ^
  -d "{\"usuarioId\":\"d1111111-1111-1111-1111-111111111111\",\"email\":\"admin@cordillera.cl\",\"password\":\"Admin1234!\"}"
```

---

## Endpoints BFF operativos

| Método | Ruta                             | Estado | Depende de |
|--------|----------------------------------|--------|------------|
| POST   | /api/bff/auth/login              | ✅     | ms-auth    |
| POST   | /api/bff/auth/refresh            | ✅     | ms-auth    |
| POST   | /api/bff/auth/logout             | ✅     | ms-auth    |
| GET    | /api/bff/usuarios                | ✅     | ms-users   |
| GET    | /api/bff/usuarios/{id}           | ✅     | ms-users   |
| POST   | /api/bff/usuarios                | ✅     | ms-users + ms-auth |
| PUT    | /api/bff/usuarios/{id}/activar   | ✅     | ms-users   |
| PUT    | /api/bff/usuarios/{id}/desactivar| ✅     | ms-users   |
| GET    | /api/bff/sucursales              | ❌     | ms-datos (no corre) |
| GET    | /api/bff/kpis                    | ⚠️ 404 | ms-kpis (sin datos) |
| GET    | /api/bff/kpis/comparativo        | ⚠️ 404 | ms-kpis (sin datos) |
| GET    | /api/bff/datos                   | ❌     | ms-datos (no corre) |
