# CLAUDE.md

Guía para Claude Code en este repositorio.

## Visión general

Plataforma de monitoreo para empresa retail multi-sucursal (Grupo Cordillera). Arquitectura **BFF + microservicios**: cada microservicio es un proyecto independiente Quarkus 3 / Java 21 / Maven con su propia BD PostgreSQL. Las relaciones entre servicios son **lógicas, no FK reales** — referenciar otra entidad por ID (ej. `sucursalRefId: Long`), nunca con `@ManyToOne` cruzando servicios.

| Directorio    | Rol                          |
|---------------|------------------------------|
| `ms-users`    | Usuarios, roles, sucursales (UUID) — **referencia de patrones** |
| `ms-auth`     | Autenticación JWT HS384, BCrypt, refresh tokens |
| `ms-datos`    | Catálogo de productos y sucursales (Long id) |
| `ms-kpis`     | KPIs por sucursal/período + transacciones individuales (boletas), consume RabbitMQ |
| `ms-reportes` | Exportación PDF + Excel (KPIs + inventario + transacciones), historial en BD |
| `bff`         | Backend-for-frontend, agrega todos los microservicios |
| `front`       | React 19 + Vite + TypeScript |

Paquete Java: `com.grupofrontera.ms<name>` (ej. `com.grupofrontera.msusers`). No hay POM raíz — build desde cada directorio.

---

## Puertos

| Servicio      | HTTP   | BD host | BD dev local  | BD docker-compose |
|---------------|--------|---------|---------------|-------------------|
| `ms-auth`     | 8088   | 5435    | db_auth       | auth_db           |
| `ms-users`    | 8085   | 5434    | db_users      | users_db          |
| `ms-datos`    | 8089   | 5437    | grupofrontera | datos_db          |
| `ms-kpis`     | 8086   | 5438    | kpis_db       | kpis_db           |
| `ms-reportes` | 8087   | 5439    | db_reportes   | reportes_db       |
| `bff`         | 8090   | —       | —             | —                 |
| `front`       | 5173   | —       | —             | —                 |

Puerto 8080 → Jenkins. Puerto 8082 → SSRS. Puerto 5432 → conflicto PostgreSQL local/Docker. No revertir estos puertos.

El `docker-compose.yml` sobrescribe la URL JDBC con `QUARKUS_DATASOURCE_JDBC_URL`. Los nombres de BD de la columna "docker-compose" son los que aplican al correr con `docker compose up`.

Contenedores: `gf_ms_auth`, `gf_ms_users`, `gf_ms_datos`, `gf_ms_kpis`, `gf_ms_reportes`, `gf_bff`, `gf_front`. BDs: `gf_auth_db`, `gf_users_db`, `gf_datos_db`, `gf_kpis_db`, `gf_reportes_db`, `gf_rabbitmq`. Todas con `postgres`/`postgres`.

---

## Swagger / OpenAPI

Todos los backends (5 microservicios + bff) exponen documentación interactiva en las rutas
**por defecto de Quarkus**, también en modo packaged/Docker:

- Swagger UI → `http://localhost:<puerto>/q/swagger-ui`
- OpenAPI → `http://localhost:<puerto>/q/openapi`

Requisitos para que funcione (ya aplicados en todos):
- Dependencia `quarkus-smallrye-openapi` en el `pom.xml`.
- `quarkus.swagger-ui.always-include=true` en `application.properties` (sin esto la UI solo
  existe en `quarkus:dev`, no en producción/Docker).
- **No** usar `quarkus.swagger-ui.path` custom — se unificó al default `/q/swagger-ui`.

Nota: `GET /q/swagger-ui` devuelve `302` redirigiendo a `/q/swagger-ui/` (trailing slash);
es el comportamiento normal de Quarkus, no un error. Usa `curl -L` para seguirlo.

---

## Comandos

```shell
# Levantar todo el stack (modo normal)
docker compose up -d --build

# Reconstruir servicios específicos tras cambios de código
docker compose build ms-users ms-kpis bff ms-reportes front
docker compose up -d ms-users ms-kpis bff ms-reportes front

# Inspeccionar BD
docker exec gf_datos_db psql -U postgres -d datos_db -c "SELECT ..."

# Dev local por servicio (requiere infra en Docker)
cd ms-datos && ./mvnw quarkus:dev -Dquarkus.live-reload.port=8193  # evita conflicto con Jenkins
cd <otro-servicio> && ./mvnw quarkus:dev

# Tests
cd <servicio> && ./mvnw test     # unit tests (sin BD)
cd front && npm test             # vitest
```

### Credenciales ms-auth (registrar tras cada reset de BD)

```bash
curl -X POST http://localhost:8088/auth/register -H "Content-Type: application/json" \
  -d '{"usuarioId":"d1111111-1111-1111-1111-111111111111","email":"admin@cordillera.cl","password":"Admin1234!"}'
curl -X POST http://localhost:8088/auth/register -H "Content-Type: application/json" \
  -d '{"usuarioId":"e2222222-2222-2222-2222-222222222222","email":"soporte@cordillera.cl","password":"Soporte1234!"}'
curl -X POST http://localhost:8088/auth/register -H "Content-Type: application/json" \
  -d '{"usuarioId":"f3333333-3333-3333-3333-333333333333","email":"gerente@cordillera.cl","password":"Gerente1234!"}'
```

| Email                   | Password       | Rol     |
|-------------------------|----------------|---------|
| admin@cordillera.cl     | Admin1234!     | ADMIN   |
| soporte@cordillera.cl   | Soporte1234!   | SOPORTE |
| gerente@cordillera.cl   | Gerente1234!   | GERENTE |

---

## Arquitectura de capas (patrón ms-users)

```
Resource (JAX-RS) → Service (@ApplicationScoped) → Repository (PanacheRepositoryBase) → Entity
                                                                                       → DTO
```

- **Resources**: solo delegación, sin lógica. Devuelven DTO o `Response`.
- **Services**: `@Transactional` en métodos que modifican datos. `toDTO()`/`fromDTO()` propios. `obtenerPorId()` lanza `NotFoundException`.
- **Entities**: extienden `PanacheEntityBase`, `@Id @GeneratedValue(UUID)`, campos públicos. `@ManyToOne` real solo dentro del mismo servicio/BD.
- **DTOs**: nunca exponer entidades directamente. `*RequestDTO` / `*ResponseDTO`.
- **Errores**: `NotFoundException` (404) o `WebApplicationException` con `Response.Status` explícito (409 para duplicados).
- **Soft delete**: flag `activo`/`estado` en lugar de borrado físico.

---

## Base de datos

- **ms-auth / ms-users**: `drop-and-create` + `import.sql` — el esquema se destruye y recrea en cada arranque. Solo dev.
- **ms-datos / ms-kpis / ms-reportes**: Flyway (`migrate-at-start=true`). **Nunca editar una migración ya aplicada** — agregar una nueva `V#__*.sql`. Las semillas de ms-datos y ms-kpis se aplican solas al arrancar con BD nueva.

### Migraciones ms-datos

| Versión | Contenido |
|---------|-----------|
| V1–V6 | Historia: tablas iniciales, coordenadas, catálogo geográfico, sucursales → **reemplazadas** |
| `V7__productos_y_drop_datos.sql` | Elimina `dato_consolidado`/`log_trazabilidad`, crea `producto` (codigo, nombre, sucursal_id FK, categoria enum, stock, stock_minimo, precio, fecha_actualizacion_stock, activo) + 48 productos semilla |
| `V8__sucursal_direccion_apertura.sql` | Agrega `direccion` (VARCHAR 250) y `anio_apertura` (INT) a `sucursal` |

4 sucursales activas (ids 1–4): Don Raucho/Angol, Jurel San Jose/Coronel, Hogar Central/Santiago, TecnoSur/Puerto Montt.

Enum de categoría: `ELECTRODOMESTICO, TV, MOVIL, CONSOLA, COMPUTACION, AUDIO, ACCESORIO, OTRO`.

### Migraciones ms-kpis

| Versión | Contenido |
|---------|-----------|
| V1 | Tablas `indicador_ventas`, `indicador_inventario` |
| V2–V3 | Seed inicial + corrección de montos |
| `V4__kpis_4_sucursales.sql` | 96 KPIs semilla (4 sucursales × 12 meses) con factor estacional |
| `V5__venta_y_venta_item.sql` | Tablas `venta` (boleta: sucursal_ref_id, periodo, fecha_hora, monto_total, canal) y `venta_item` (línea: producto_ref_id lógico, codigo/nombre/categoria snapshot, cantidad, precio_unitario, subtotal) |
| `V6__generar_ventas_historicas.sql` | PL/pgSQL: genera boletas sintéticas para los 96 combos ya sembrados en V4, cuadrando exacto con `total_ventas`/`cantidad_transacciones` de cada fila |
| `V7__kpis_julio_2026.sql` | Agrega el periodo del mes en curso (2026-07) para las 4 sucursales, mismo patrón determinista de V4 |
| `V8__generar_ventas_julio_2026.sql` | Boletas para el periodo agregado en V7, mismo método de V6 |

Tablas reales: `indicador_ventas`, `indicador_inventario`, `venta`, `venta_item` (no existe tabla `kpis`).

### Migraciones ms-reportes

| Versión | Contenido |
|---------|-----------|
| `V1__reporte_generado.sql` | Tabla `reporte_generado` (tipo, formato, periodo, sucursal_id, sucursal_nombre, favorito, fecha_generacion) — arranca vacía |

ms-reportes **no guarda el archivo PDF/Excel**, solo los parámetros. "Descargar" un reporte del historial regenera el archivo al vuelo.

---

## ms-kpis — edición manual de KPIs

`PUT /kpis` — crea o actualiza `IndicadorVentas` para una sucursal+período. Recalcula automáticamente `ticket_promedio` y `porcentaje_cumplimiento`.

```java
// ActualizarKpisRequest
public Long sucursalId;
public String periodo;       // "YYYY-MM"
public BigDecimal totalVentas;
public Integer cantidadTransacciones;
public BigDecimal metaMensual;
```

Disponible para roles ADMIN y GERENTE (verificado en el front, no en el backend).

---

## ms-kpis — transacciones individuales (boletas)

Entidades `Venta` (boleta) y `VentaItem` (línea de producto), estilo Active Record igual
que `IndicadorVentas` — **sin** capa Repository. `VentaItem` guarda un *snapshot* de
`codigoProducto`/`nombreProducto`/`categoria`/`precioUnitario` al momento de la venta (no
se re-consulta ms-datos en cada lectura); `productoRefId` es una referencia lógica
opcional, sin FK real hacia ms-datos.

| Método | Path | Descripción |
|--------|------|-------------|
| GET | `/ventas?sucursalId=&periodoDesde=&periodoHasta=&page=&size=` | Lista paginada de boletas. `sucursalId` opcional (omitido = todas), rango de período obligatorio |
| GET | `/ventas/{id}` | Detalle de una boleta con sus líneas de producto |

**Importante:** `VentaRecurso` está montado en `@Path("/ventas")` — **raíz, no anidado
bajo `/kpis`**. El bff y ms-reportes usan un REST client dedicado (`VentaClient` /
`ClienteVentas`) apuntando a `/ventas`, separado del `KpisClient`/`ClienteKpis` que
apunta a `/kpis`. Meter estos métodos dentro del client de `/kpis` por error hace que las
llamadas salgan a `/kpis/ventas` (404) — ya pasó una vez, ver historial de commits.

Respuesta de `/ventas` envuelta en `{content, totalElements, totalPages, page, size}` —
es el único endpoint paginado del repo (no existe otro patrón de paginación previo, se
introdujo acotado a este caso).

---

## ms-users — permisos de rol

`Rol` tiene columna `permisos TEXT` que almacena un JSON `Map<String, String>` (módulo → nivel de acceso). Módulos: `dashboard`, `reportes`, `productos`, `usuarios`, `roles`, `sucursales`. Niveles: `sin-acceso`, `lectura`, `edicion`, `total`.

`RolService` serializa/deserializa con `ObjectMapper` (`@Inject`). Los 3 roles base tienen permisos definidos en `import.sql`:
- **ADMIN**: todo `total`
- **SOPORTE**: dashboard/reportes/productos/sucursales `edicion`, usuarios/roles `sin-acceso`
- **GERENTE**: dashboard `edicion`, reportes `lectura`, productos/sucursales `lectura`, usuarios/roles `sin-acceso`

`RolRequestDTO` y `RolResponseDTO` incluyen `Map<String, String> permisos`. El BFF pasa permisos de forma transparente.

---

## ms-reportes — exportación

`GET /reportes/exportar?formato=pdf|xlsx&periodo=YYYY-MM[&sucursalId=N]` — exporta KPIs **+ inventario de productos + transacciones** en un solo archivo (informe completo). `periodo` es siempre **un solo mes**, no un rango (a diferencia del selector Desde/Hasta de la pantalla Reportes).

- **PDF individual**: título "Informe de Gestión por Sucursal", orientación landscape, tabla KPIs + sección "Detalle de Inventario" (tarjetas resumen + tabla completa de productos) + sección "Detalle de Transacciones" (fecha/hora, canal, monto).
- **PDF consolidado**: tabla comparativa de todas las sucursales + sección de inventario agrupada por sucursal + sección de transacciones agrupada por sucursal (con subtotales).
- **Excel individual**: tres pestañas — `KPIs`, `Inventario` y `Transacciones`.
- **Excel consolidado**: tres pestañas — `KPIs` (tabla comparativa), `Inventario` y `Transacciones` (ambas agrupadas por sucursal con subtotales).
- Nombre de archivo: `informe_sucursal{id}_{periodo}.pdf/xlsx` o `informe_consolidado_{periodo}.pdf/xlsx`.
- Productos desde ms-datos, transacciones desde ms-kpis (`/ventas`, vía `ClienteVentas`) — ambos por REST client; si cualquiera falla, el informe continúa sin esa sección (lista vacía).
- Transacciones: **resumen por boleta, sin desglose de productos** (un mes puede tener miles de boletas; con productos el archivo sería enorme). Ver `ExportacionServicio.tablaTransacciones`/`escribirFilaVenta`.

`GET /reportes/inventario?formato=pdf|xlsx[&sucursalId=N]` — exporta **solo** inventario (sin KPIs ni transacciones). Sin cambios respecto a antes.

---

## Endpoints BFF (`http://localhost:8090`)

| Método | Path | Upstream |
|--------|------|----------|
| POST | /api/bff/auth/login | ms-auth |
| POST | /api/bff/auth/refresh | ms-auth |
| POST | /api/bff/auth/logout | ms-auth |
| GET | /api/bff/usuarios | ms-users (solo activos) |
| GET | /api/bff/usuarios/todos | ms-users (incl. inactivos) |
| GET/POST | /api/bff/usuarios | ms-users + ms-auth (alta) |
| PUT | /api/bff/usuarios/{id} | ms-users (perfil: nombre/apellido/email/telefono) |
| PUT | /api/bff/usuarios/{id}/activar | ms-users |
| PUT | /api/bff/usuarios/{id}/desactivar | ms-users |
| GET/POST | /api/bff/usuarios/{id}/sucursales | ms-users (/usuario-sucursales) |
| DELETE | /api/bff/usuarios/asignaciones-sucursal/{id} | ms-users |
| GET/POST | /api/bff/roles | ms-users |
| GET/POST/PUT | /api/bff/sucursales | ms-datos |
| PUT | /api/bff/sucursales/{id}/estado | ms-datos (body: `{activo: bool}`) |
| GET | /api/bff/sucursales/{id}/usuarios | ms-users |
| GET | /api/bff/kpis | ms-kpis |
| GET | /api/bff/kpis/comparativo | ms-kpis |
| PUT | /api/bff/kpis | ms-kpis (edición manual KPIs) |
| GET | /api/bff/kpis/ventas | ms-kpis (paginado, filtros sucursalId/periodoDesde/periodoHasta) |
| GET | /api/bff/kpis/ventas/{id} | ms-kpis (detalle de boleta con productos) |
| GET | /api/bff/productos | ms-datos (filtros: sucursalId, categoria, q, activo) |
| GET/POST/PUT | /api/bff/productos/{id} | ms-datos |
| PUT | /api/bff/productos/{id}/estado | ms-datos |
| POST | /api/bff/productos/importar | ms-datos (insert-only) |
| GET | /api/bff/productos/categorias | ms-datos |
| GET | /api/bff/reportes/exportar | ms-reportes (KPIs + inventario) |
| GET | /api/bff/reportes/inventario | ms-reportes (solo inventario) |
| GET | /api/bff/reportes-guardados | ms-reportes |
| DELETE | /api/bff/reportes-guardados/{id} | ms-reportes |
| PUT | /api/bff/reportes-guardados/{id}/favorito | ms-reportes |

**Detalles BFF importantes:**
- CORS: `quarkus.http.cors.enabled=true` (no `quarkus.http.cors=true`) + `exposed-headers=Content-Disposition`.
- `ClientExceptionMapper` propaga 4xx de upstream. `quarkus.rest-client.disable-default-mapper=true`.
- Alta de usuario: usa `HashMap` (no `Map.of` — NPE con null). Lee response con `readEntity()` (no `getEntity()`).
- ms-users expone asignaciones en `/usuario-sucursales`, no en `/usuarios/{id}/sucursales`.
- `ReporteGeneradoResource` es un resource separado de `ReporteResource` (paths raíz distintos).
- `/api/bff/kpis/ventas*` usa un REST client separado (`VentaClient`), no `KpisClient` — ms-kpis monta `VentaRecurso` en `/ventas` (raíz), no bajo `/kpis`.

---

## Frontend (`front/src/`)

**Stack**: React 19 + Vite + TypeScript. `npm run dev` → `http://localhost:5173`.

### API layer (`api/`)

| Archivo | Funciones |
|---------|-----------|
| `types.ts` | `UsuarioDTO`, `SucursalDTO`, `RespuestaKpis`, `ProductoDTO`, `KpisUpdatePayload`, `RolDTO` (con `permisos: Record<string,string>`), `RolCreatePayload`, `VentaResumenDTO`, `VentaDetalleDTO`, `VentaItemDTO`, `VentaPaginaDTO` |
| `client.ts` | fetch wrapper: header Authorization, auto-refresh en 401, AbortSignal. `BFF_URL` **relativo** (`''`) — ver nota abajo |
| `auth.ts` | `loginApi`, `logoutApi`, `refreshApi`. Mismo `BFF_URL` relativo que `client.ts` (fetch propio, no usa `apiFetch`) |
| `usuarios.ts` | CRUD usuarios |
| `roles.ts` | `listarRoles`, `crearRol` (con permisos) |
| `sucursales.ts` | CRUD sucursales + `listarUsuariosSucursal` |
| `kpis.ts` | `obtenerKpis`, `obtenerComparativo`, `actualizarKpis` (PUT), `listarVentas` (paginado), `obtenerVentaDetalle` |
| `reportes.ts` | `exportarReporte`, `exportarInventario` → blob download |
| `reportesGuardados.ts` | `listarReportesGuardados`, `eliminarReporteGuardado`, `marcarFavoritoReporte` |
| `productos.ts` | CRUD productos + `importarProductos` |

### Utils

| Archivo | Contenido |
|---------|-----------|
| `utils/rut.ts` | `validarRut`, `formatearRut` (módulo 11 chileno) |
| `utils/periodo.ts` | `ultimosMeses(periodo, n)`, `rangoMeses(desde, hasta)` (max 24 meses), `formatearPeriodo` |
| `utils/permisos.ts` | `puedeVerUsuariosYRoles(roles)` → solo ADMIN; `puedeGestionarSucursales(roles)` → ADMIN + SOPORTE; `puedeEditarKpis(roles)` → ADMIN + GERENTE |

### Componentes

| Archivo | Contenido |
|---------|-----------|
| `components/Icon.tsx` | Wrapper lucide-react, lookup kebab-case |
| `components/Primitives.tsx` | Badge, Delta, Button, Avatar, KpiCard, PageHead, Panel, ModalOverlay |
| `components/Sidebar.tsx` | Nav filtrado por permisos |
| `components/Chart.tsx` | Gráfico SVG de línea, theme-aware |
| `components/EditarKpisModal.tsx` | Modal para editar totalVentas, cantidadTransacciones, metaMensual. Campos vacíos = no modificar. Recálculo automático en backend. |
| `components/DetalleVentasModal.tsx` | Modal de transacciones: vista "lista" (paginada, fecha/hora/sucursal/canal/monto) y vista "boleta" (detalle con productos) en el mismo componente, con botón volver |

### Vistas

| Vista | Estado |
|-------|--------|
| `DashboardView` | KPIs reales, selector sucursal + alcance mes/todos. Botón "Editar KPIs" eliminado de aquí (movido a Reportes). |
| `ReportesView` | Comparativo real + gráfico con rango Desde/Hasta (`rangoMeses`). Botón "Editar KPIs" para ADMIN/GERENTE al seleccionar sucursal específica. Tarjeta "Transacciones" clickeable → `DetalleVentasModal` (no existe tarjeta "Ticket promedio", se quitó). Exporta "Informe PDF/Excel" (KPIs + inventario + transacciones). |
| `UsersView` | CRUD usuarios, validación RUT, modal edición, asignación sucursales |
| `RolesView` | Matriz de permisos al crear rol (6 módulos × 4 niveles). Permisos reales desde BD en modal "Ver". |
| `BranchesView` | CRUD sucursales, mapa MapLibre, tarjeta detalle (Jefe/Ventas/Stock de 3 servicios), ruta OSRM |
| `ProductosView` | Catálogo, filtros, importar JSON, export inventario |
| `ReportesGuardadosView` | Historial real, favorito, eliminar, regenerar descarga |
| `ConfiguracionView` | Solo tema claro/oscuro |

### Contextos y hooks

- `AuthContext`: `accessToken` en memoria, `refreshToken` en `localStorage['cord_rt']`.
- `PrefsContext`: tema + densidad, persiste en localStorage.
- `useDebounce(value, 350)`: en búsquedas.

### Control de acceso por rol

Implementado en 3 capas: `Sidebar` (oculta nav), `App.tsx` (`vistaRestringida`), dentro de cada vista (botones). Lógica centralizada en `utils/permisos.ts`. Roles nuevos creados desde la UI quedan restringidos hasta agregarse a `permisos.ts`.

### Patrones importantes

- `listarUsuarios()` llama a `/todos` (incluye inactivos) — el filtro "Solo activos" es del lado cliente.
- `apiFetch` tolera 204 y 200 sin body (`parseBody` helper).
- Todos los `useEffect` de fetch usan `AbortController` y cancelan al desmontar.
- Mapa usa `latitud`/`longitud` de la sucursal (editables en modal). Fallback a tabla estática `COORDS`.
- **Nunca hardcodear `http://localhost:8090`** en el front. `BFF_URL` en `client.ts`/`auth.ts` es `''` (ruta relativa); `nginx.conf` la proxea a `bff` en Docker y `vite.config.ts` (`server.proxy`) a `localhost:8090` en `npm run dev`. Si se hardcodea, la app deja de funcionar desde cualquier PC que no sea el que corre el backend (login incluido).

### Testing

| Módulo | Herramienta | Comando |
|--------|-------------|---------|
| ms-auth | Mockito (`AuthServiceTest` 16 tests) | `./mvnw test` (sin BD) |
| ms-users | Mockito (4 clases, 17 tests) | `./mvnw test` (sin BD) |
| ms-datos | `@QuarkusTest` + H2 (`ProductoServiceTest` 19, `SucursalServiceTest` 5) | `./mvnw test` |
| ms-kpis | Mockito + mockStatic (`KpisServicioTest` 5) | `./mvnw test` |
| ms-reportes | Mockito (`ReporteGeneradoServiceTest` 10, `ReportesServicioTest` 10) | `./mvnw test` |
| bff | `@QuarkusTest` + JUnit (`BffResourceTest` 1, `ClientExceptionMapperTest` 4) | `./mvnw test` |
| front | Vitest + RTL (15 tests, 7 archivos) | `npm test` |

`maven-surefire-plugin` excluye `*ResourceTest.java` por defecto — solo corre `*ServiceTest` (sin BD). Para smoke tests con BD real: `./mvnw test -Pdb-tests`.

ms-datos usa `quarkus-jacoco` en vez del plugin estándar (bytecode enhancement de Panache incompatible con el agente JaCoCo normal). ms-kpis y ms-reportes usan H2 en perfil `%test` (`quarkus.flyway.enabled=false`).

`front/vitest.config.ts` está separado de `vite.config.ts` — vite 8+ (Rolldown) es incompatible a nivel de tipos con el vite interno de vitest. `front/src/test/setup.ts` incluye polyfill de `localStorage` (el Node de esta máquina expone un `localStorage` nativo experimental roto).

### Design system

Paleta dark: `#0F0F0F` base → `#1A1A1A` sidebar → `#1E1E1E` cards → `#252525` hover.
Fuentes: **Geist** (títulos) · **Inter** (cuerpo) · **Geist Mono** (números/KPIs).
Tema claro vía `[data-theme="light"]`, controlado desde Configuración.
