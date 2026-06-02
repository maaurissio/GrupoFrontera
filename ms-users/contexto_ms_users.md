# CONTEXTO COMPLETO — MS-Users
# Plataforma de Monitoreo Gerencial · Grupo Cordillera
# Para uso en Claude Code / terminal

---

## 1. DESCRIPCIÓN DEL PROYECTO

Sistema de monitoreo gerencial para una empresa de retail multi-sucursal.
Arquitectura: BFF + 8 microservicios, cada uno con su propia base de datos PostgreSQL.
Stack: Quarkus 3.34.5 · Java 21 · Maven · PostgreSQL · Docker.

ms-users es el microservicio de dominio de usuarios. NO maneja autenticación
(eso es ms-auth). Su responsabilidad es datos personales, roles y sucursales.

---

## 2. STACK TÉCNICO EXACTO

- Framework:       Quarkus 3.34.5
- Lenguaje:        Java 21
- Build:           Maven (mvnw incluido)
- ORM:             Hibernate ORM + Panache (PanacheRepositoryBase)
- Base de datos:   PostgreSQL 16 · base: db_users · puerto host: 5434
- REST:            quarkus-rest + quarkus-rest-jackson
- Validación:      quarkus-hibernate-validator
- API docs:        quarkus-smallrye-openapi + Swagger UI
- Tests:           quarkus-junit + rest-assured
- Contenedor:      Docker · imagen: eclipse-temurin:21-jdk
- Puerto servicio: 8082
- groupId:         cl.duoc.cordillera
- artifactId:      ms-users

---

## 3. ARQUITECTURA INTERNA (capas)

Resource (REST)  →  Service (lógica negocio)  →  Repository (Panache)  →  Entity (JPA)
                                                                        →  DTO (entrada/salida)

Regla: los Resources NO contienen lógica de negocio.
Regla: los Services son @Transactional cuando modifican datos.
Regla: nunca exponer entidades directamente, siempre usar DTOs.
Regla: las relaciones entre microservicios distintos son LÓGICAS (no FK real),
       usando campos como sucursalRefId (Long o UUID).

---

## 4. ENTIDADES JPA EXISTENTES

Todas extienden PanacheEntityBase y usan @GeneratedValue(strategy = UUID).

### 4.1 Usuario
```java
@Entity @Table(name = "usuarios")
public class Usuario extends PanacheEntityBase {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    public UUID id;

    @Column(nullable = false, unique = true)
    public String rut;           // ej. "12345678"

    @Column(nullable = false)
    public String dv;            // ej. "9"

    @Column(nullable = false)
    public String nombre;

    @Column(nullable = false)
    public String apellido;

    @Column(nullable = false, unique = true)
    public String email;

    @Column(nullable = true)
    public String telefono;

    @Column(nullable = true)
    public LocalDate fechaNacimiento;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public EstadoUsuario estado;  // ACTIVO | INACTIVO | BLOQUEADO

    @Column(nullable = false)
    public LocalDateTime creadoEn;

    @Column(nullable = false)
    public LocalDateTime actualizadoEn;
}
```

### 4.2 Rol
```java
@Entity @Table(name = "roles")
public class Rol extends PanacheEntityBase {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    public UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true)
    public NombreRol nombre;     // enum: ADMIN,CLIENTE,VENDEDOR,SOPORTE,GERENTE,
                                 //        LOGISTICA,RRHH,CONTABILIDAD,OPERADOR,SUPERVISOR

    @Column(nullable = true)
    public String descripcion;

    @Column(nullable = false)
    public Boolean activo = true;

    @Column(nullable = false)
    public LocalDateTime creadoEn;

    @Column(nullable = false)
    public LocalDateTime actualizadoEn;
}
```

### 4.3 Sucursal
```java
@Entity @Table(name = "sucursales")
public class Sucursal extends PanacheEntityBase {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    public UUID id;

    @Column(nullable = false, unique = true)
    public String nombre;

    @Column(nullable = false)
    public String direccion;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ciudad_id")
    public Ciudad ciudad;        // FK real, misma BD

    @Column(nullable = false)
    public Boolean activo = true;

    @Column(nullable = false)
    public LocalDateTime creadoEn;

    @Column(nullable = false)
    public LocalDateTime actualizadoEn;
}
```

### 4.4 Ciudad y Region
```java
@Entity @Table(name = "ciudades")
public class Ciudad extends PanacheEntityBase {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    public UUID id;
    public String nombre;
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "region_id", nullable = false)
    public Region region;
}

@Entity @Table(name = "regiones")
public class Region extends PanacheEntityBase {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    public UUID id;
    @Column(nullable = false, unique = true)
    public String nombre;
}
```

### 4.5 UsuarioRol (tabla pivot)
```java
@Entity @Table(name = "usuario_roles")
public class UsuarioRol extends PanacheEntityBase {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    public UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    public Usuario usuario;

    @ManyToOne(optional = false)
    @JoinColumn(name = "rol_id", nullable = false)
    public Rol rol;

    @Column(nullable = false)
    public LocalDateTime asignadoEn;

    @Column(nullable = false)
    public Boolean activo = true;
}
```

### 4.6 UsuarioSucursal (tabla pivot)
```java
@Entity @Table(name = "usuario_sucursales")
public class UsuarioSucursal extends PanacheEntityBase {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    public UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    public Usuario usuario;

    @ManyToOne(optional = false)
    @JoinColumn(name = "sucursal_id", nullable = false)
    public Sucursal sucursal;

    @Column(nullable = false)
    public LocalDateTime asignadoEn;

    @Column(nullable = false)
    public Boolean activo = true;
}
```

---

## 5. ENUMS

```java
// EstadoUsuario
public enum EstadoUsuario { ACTIVO, INACTIVO, BLOQUEADO }

// NombreRol
public enum NombreRol {
    ADMIN, CLIENTE, VENDEDOR, SOPORTE, GERENTE,
    LOGISTICA, RRHH, CONTABILIDAD, OPERADOR, SUPERVISOR
}
```

---

## 6. DTOs EXISTENTES

### Entrada
```java
// UsuarioRequestDTO — crear usuario
public class UsuarioRequestDTO {
    public String rut;
    public String dv;
    public String nombre;
    public String apellido;
    public String email;
    public String telefono;
    public LocalDate fechaNacimiento;
}

// UsuarioUpdateRequestDTO — actualizar usuario
public class UsuarioUpdateRequestDTO {
    public String nombre;
    public String apellido;
    public String email;
    public String telefono;
    public LocalDate fechaNacimiento;
}

// RolRequestDTO
public class RolRequestDTO {
    public NombreRol nombre;
    public String descripcion;
}

// SucursalRequestDTO
public class SucursalRequestDTO {
    public String nombre;
    public String direccion;
    public UUID ciudadId;
}

// UsuarioRolRequestDTO
public class UsuarioRolRequestDTO {
    public UUID usuarioId;
    public UUID rolId;
}

// UsuarioSucursalRequestDTO
public class UsuarioSucursalRequestDTO {
    public UUID usuarioId;
    public UUID sucursalId;
}
```

### Salida
```java
// UsuarioResponseDTO — incluye roles y sucursales como listas de strings
public class UsuarioResponseDTO {
    public UUID id;
    public String rut;
    public String dv;
    public String nombre;
    public String apellido;
    public String email;
    public String telefono;
    public LocalDate fechaNacimiento;
    public EstadoUsuario estado;
    public List<String> roles;       // nombres de roles activos
    public List<String> sucursales;  // nombres de sucursales activas
}

// RolResponseDTO
public class RolResponseDTO {
    public UUID id;
    public NombreRol nombre;
    public String descripcion;
}

// SucursalResponseDTO
public class SucursalResponseDTO {
    public UUID id;
    public String nombre;
    public String direccion;
    public UUID ciudadId;
    public String ciudad;
    public UUID regionId;
    public String region;
}

// UsuarioRolResponseDTO
public class UsuarioRolResponseDTO {
    public UUID id;
    public UUID usuarioId;
    public String nombreUsuario;
    public UUID rolId;
    public String nombreRol;
    public LocalDateTime asignadoEn;
}

// UsuarioSucursalResponseDTO
public class UsuarioSucursalResponseDTO {
    public UUID id;
    public UUID usuarioId;
    public String nombreUsuario;
    public UUID sucursalId;
    public String nombreSucursal;
    public LocalDateTime asignadoEn;
}

// CiudadResponseDTO
public class CiudadResponseDTO {
    public UUID id;
    public String nombre;
    public UUID regionId;
    public String region;
}

// RegionResponseDTO
public class RegionResponseDTO {
    public UUID id;
    public String nombre;
}
```

---

## 7. REPOSITORIOS (PanacheRepositoryBase)

```java
// UsuarioRepository
public boolean existePorRut(String rut)   // find("rut", rut)
public boolean existePorEmail(String email)

// RolRepository
public boolean existePorNombre(NombreRol nombre)

// SucursalRepository
public boolean existePorNombre(String nombre)
public boolean existePorNombreExceptoId(String nombre, UUID id)

// UsuarioRolRepository
public boolean existeAsignacionActiva(Usuario usuario, Rol rol)
public List<UsuarioRol> listarRolesPorUsuario(Usuario usuario)   // activo=true
public List<UsuarioRol> listarUsuariosPorRol(Rol rol)            // activo=true

// UsuarioSucursalRepository
public boolean existeAsignacionActiva(Usuario usuario, Sucursal sucursal)
public List<UsuarioSucursal> listarSucursalesPorUsuario(Usuario usuario)  // activo=true
public List<UsuarioSucursal> listarUsuariosPorSucursal(Sucursal sucursal) // activo=true

// CiudadRepository
public List<Ciudad> listarPorNombre()
public List<Ciudad> listarPorRegion(Region region)
public boolean existePorNombreYRegion(String nombre, Region region)

// RegionRepository
public List<Region> listarPorNombre()
public boolean existePorNombre(String nombre)
```

---

## 8. SERVICIOS (lógica de negocio)

### UsuarioService
```
listarActivos()         → list("estado", ACTIVO)
listarTodos()           → listAll()
crear(Usuario)          → valida unicidad rut+email, estado=ACTIVO, timestamps, persist
actualizar(UUID, DTO)   → actualiza campos no nulos, actualizadoEn=now()
obtenerPorId(UUID)      → findById o NotFoundException
buscarPorNombre(String) → LIKE ignorando case, solo ACTIVOS
desactivar(UUID)        → estado=INACTIVO
activar(UUID)           → estado=ACTIVO
toDTO(Usuario)          → puebla roles y sucursales activos via repositorios
fromDTO(UsuarioRequestDTO) → new Usuario() con campos del DTO
```

### RolService
```
listarActivos()         → list("activo", true)
obtenerPorId(UUID)
crear(Rol)              → valida unicidad nombre, activo=true, timestamps
actualizar(UUID, Rol)
activar(UUID) / desactivar(UUID)
toDTO(Rol) / fromDTO(RolRequestDTO)
```

### SucursalService
```
listarActivos()
obtenerPorId(UUID)
crear(SucursalRequestDTO)   → resuelve Ciudad por ciudadId, valida nombre único
actualizar(UUID, DTO)
activar(UUID) / desactivar(UUID)
toDTO(Sucursal) → incluye ciudad.nombre, ciudad.region.nombre
```

### UsuarioRolService
```
asignarRol(UsuarioRolRequestDTO)     → valida no duplicado activo, persist
listarActivos()
listarRolesPorUsuario(UUID)
listarUsuariosPorRol(UUID)
desactivarAsignacion(UUID)           → activo=false
toDTO(UsuarioRol)
```

### UsuarioSucursalService
```
asignarSucursal(UsuarioSucursalRequestDTO) → valida no duplicado, persist
listarActivos()
listarSucursalesPorUsuario(UUID)
listarUsuariosPorSucursal(UUID)
desactivarAsignacion(UUID)
toDTO(UsuarioSucursal)
```

---

## 9. ENDPOINTS REST EXISTENTES

### UsuarioResource  (/usuarios)
| Método | Ruta                  | Descripción                          |
|--------|-----------------------|--------------------------------------|
| GET    | /usuarios             | Lista usuarios ACTIVOS               |
| GET    | /usuarios/todos       | Lista TODOS los usuarios             |
| GET    | /usuarios/{id}        | Obtiene usuario por ID               |
| GET    | /usuarios/buscar?nombre= | Búsqueda por nombre (LIKE)        |
| POST   | /usuarios             | Crea usuario → HTTP 201              |
| PUT    | /usuarios/{id}        | Actualiza datos personales           |
| PUT    | /usuarios/{id}/activar   | Cambia estado a ACTIVO            |
| PUT    | /usuarios/{id}/desactivar | Cambia estado a INACTIVO         |

### RolResource  (/roles)
| Método | Ruta               | Descripción              |
|--------|--------------------|--------------------------|
| GET    | /roles             | Lista roles activos      |
| GET    | /roles/{id}        | Obtiene rol por ID       |
| POST   | /roles             | Crea rol → HTTP 201      |
| PUT    | /roles/{id}        | Actualiza rol            |
| PUT    | /roles/{id}/activar   | Activa rol            |
| PUT    | /roles/{id}/desactivar | Desactiva rol        |

### SucursalResource  (/sucursales)
| Método | Ruta                      | Descripción               |
|--------|---------------------------|---------------------------|
| GET    | /sucursales               | Lista activas             |
| GET    | /sucursales/{id}          | Por ID                    |
| POST   | /sucursales               | Crea → HTTP 201           |
| PUT    | /sucursales/{id}          | Actualiza                 |
| PUT    | /sucursales/{id}/activar  | Activa                    |
| PUT    | /sucursales/{id}/desactivar | Desactiva               |

### UsuarioRolResource  (/usuario-roles)
| Método | Ruta                              | Descripción              |
|--------|-----------------------------------|--------------------------|
| GET    | /usuario-roles                    | Lista asignaciones activas |
| POST   | /usuario-roles                    | Asigna rol a usuario     |
| GET    | /usuario-roles/usuario/{id}       | Roles de un usuario      |
| GET    | /usuario-roles/rol/{id}           | Usuarios con ese rol     |
| PUT    | /usuario-roles/{id}/desactivar    | Quita rol                |

### UsuarioSucursalResource  (/usuario-sucursales)
| Método | Ruta                                  | Descripción                |
|--------|---------------------------------------|----------------------------|
| GET    | /usuario-sucursales                   | Lista asignaciones activas |
| POST   | /usuario-sucursales                   | Asigna sucursal a usuario  |
| GET    | /usuario-sucursales/usuario/{id}      | Sucursales de un usuario   |
| GET    | /usuario-sucursales/sucursal/{id}     | Usuarios de una sucursal   |
| PUT    | /usuario-sucursales/{id}/desactivar   | Quita sucursal             |

### CiudadResource  (/ciudades)
| GET    | /ciudades                    | Lista todas              |
| GET    | /ciudades/region/{regionId}  | Filtra por región        |

### RegionResource  (/regiones)
| GET    | /regiones                    | Lista todas              |

---

## 10. CONFIGURACIÓN (application.properties)

```properties
quarkus.http.port=8082

quarkus.datasource.db-kind=postgresql
quarkus.datasource.username=usuario_cordillera
quarkus.datasource.password=cordillera_pass
quarkus.datasource.jdbc.url=jdbc:postgresql://localhost:5434/db_users
quarkus.datasource.devservices.enabled=false

# DESARROLLO: drop-and-create + seed
quarkus.hibernate-orm.schema-management.strategy=drop-and-create
quarkus.hibernate-orm.sql-load-script=import.sql

# PRODUCCIÓN (cambiar antes de entregar):
# quarkus.hibernate-orm.schema-management.strategy=update

quarkus.swagger-ui.always-include=true
```

---

## 11. DOCKER

### Dockerfile (ms-users)
```dockerfile
FROM eclipse-temurin:21-jdk
WORKDIR /app
COPY target/quarkus-app/lib/ /app/lib/
COPY target/quarkus-app/*.jar /app/
COPY target/quarkus-app/app/ /app/app/
COPY target/quarkus-app/quarkus/ /app/quarkus/
EXPOSE 8082
CMD ["java", "-jar", "/app/quarkus-run.jar"]
```

### docker-compose.yml (ms-users)
```yaml
version: '3.8'
services:
  db-users:
    image: postgres:16
    container_name: pg-users
    environment:
      POSTGRES_USER: usuario_cordillera
      POSTGRES_PASSWORD: cordillera_pass
      POSTGRES_DB: db_users
    ports:
      - "5434:5432"
    volumes:
      - pgdata_users:/var/lib/postgresql/data
    networks:
      - cordillera-net

  ms-users:
    build: .
    container_name: ms-users
    depends_on:
      - db-users
    ports:
      - "8082:8082"
    environment:
      QUARKUS_DATASOURCE_DB_KIND: postgresql
      QUARKUS_DATASOURCE_USERNAME: usuario_cordillera
      QUARKUS_DATASOURCE_PASSWORD: cordillera_pass
      QUARKUS_DATASOURCE_JDBC_URL: jdbc:postgresql://db-users:5432/db_users
    networks:
      - cordillera-net

networks:
  cordillera-net:
    driver: bridge

volumes:
  pgdata_users:
```

---

## 12. DATOS DE SEED (import.sql)

```sql
-- Regiones
INSERT INTO regiones (id, nombre) VALUES
('f485b682-9484-4aa9-ad73-a3ac7d77be47', 'Region Metropolitana de Santiago'),
('45d3d1b1-160f-4738-8ee0-33fbd2c6d253', 'Region de Valparaiso'),
('c9dbd5b9-d7ab-488c-814f-7aeecb9f7b6e', 'Region del Biobio');

-- Ciudades
INSERT INTO ciudades (id, nombre, region_id) VALUES
('cc880288-88de-4e34-8a9c-871bf58a1e8e', 'Santiago',   'f485b682-...'),
('1add8072-4c65-4c8c-b3dd-ea9afcc6d753', 'Valparaiso', '45d3d1b1-...'),
('68c61287-0e27-40df-9b04-d4355c8bf39b', 'Concepcion', 'c9dbd5b9-...');

-- Roles
INSERT INTO roles (id, nombre, descripcion, activo, creadoEn, actualizadoEn) VALUES
('11111111-...', 'ADMIN',   'Administrador', true, now(), now()),
('22222222-...', 'SOPORTE', 'Soporte',       true, now(), now()),
('33333333-...', 'GERENTE', 'Gerente',       true, now(), now());

-- Usuarios (3 de prueba: admin, soporte, gerente)
INSERT INTO usuarios (id, rut, dv, nombre, apellido, email, ..., estado, ...) VALUES
('11111111-...', '11111111', '1', 'Maurisio', 'Admin',   'admin@cordillera.cl',   ..., 'ACTIVO', ...),
('22222222-...', '22222222', '2', 'Carlos',   'Soporte', 'soporte@cordillera.cl', ..., 'ACTIVO', ...),
('33333333-...', '33333333', '3', 'Maria',    'Gerente', 'gerente@cordillera.cl', ..., 'ACTIVO', ...);

-- Sucursales (3: Santiago Centro, Valparaiso, Concepcion)
-- Usuario-Roles (cada usuario tiene su rol correspondiente)
-- Usuario-Sucursales (asignaciones de ejemplo)
```

---

## 13. BOOTSTRAP DE DATOS GEOGRÁFICOS

CatalogoGeograficoBootstrap se ejecuta en @Observes StartupEvent.
Crea regiones y ciudades si no existen (idempotente).
Asigna ciudad a sucursales existentes que no tienen ciudad por nombre/dirección.

---

## 14. HISTORIAS DE USUARIO

### HU-USERS-01 — Registrar nuevo usuario
- Como: administrador
- Quiero: crear usuario con RUT, nombre, email, teléfono
- Para: que pueda autenticarse (via ms-auth) y acceder según su rol
- Criterios:
  * Valida unicidad de RUT y email → HTTP 409 si ya existen
  * Se crea con estado ACTIVO
  * Retorna HTTP 201 con UsuarioResponseDTO
  * La password NO se maneja aquí (es ms-auth)

### HU-USERS-02 — Asignar sucursales a usuario
- Como: administrador
- Quiero: vincular usuario con una o más sucursales
- Para: que solo vea info de sus sucursales
- Criterios:
  * Crea registro en usuario_sucursales por cada sucursal
  * No permite duplicados activos → HTTP 409
  * El BFF sincroniza altas y bajas al actualizar

### HU-USERS-03 — Consultar mi perfil autenticado (/me desde BFF)
- Como: usuario autenticado
- Quiero: GET /bff/usuarios/me con mi token
- Para: ver mis datos, roles y sucursales
- Criterios:
  * BFF valida token y obtiene usuarioId
  * Retorna nombre, apellido, email, estado, roles[], sucursales[]
  * Token inválido → HTTP 401

### HU-USERS-04 — Desactivar usuario
- Como: administrador
- Quiero: PUT /usuarios/{id}/desactivar
- Para: que no pueda iniciar sesión ni acceder
- Criterios:
  * Cambia estado a INACTIVO
  * No aparece en GET /usuarios (solo activos)
  * Puede reactivarse con /activar

---

## 15. CASOS DE USO

### CU-USERS-01 — Crear usuario con sucursales (flujo BFF)
Pre: administrador con token ADMIN válido
Flujo:
  1. BFF recibe POST /bff/usuarios/register { datos + password + sucursalIds[] }
  2. BFF envía POST /usuarios a ms-users (sin password)
  3. ms-users valida unicidad RUT/email
  4. ms-users persiste → retorna DTO con id
  5. BFF envía POST /auth/register { usuarioId, email, password } a ms-auth
  6. BFF sincroniza sucursales vía POST /usuario-sucursales por cada sucursalId
  7. BFF retorna HTTP 201 con perfil completo
Excepciones:
  - RUT/email duplicado → 409
  - ms-auth falla → BFF desactiva usuario (transacción compensatoria) → 502
  - Error sucursales → 502 tras desactivar usuario

### CU-USERS-02 — Consultar usuarios activos
Pre: token válido
Flujo:
  1. BFF recibe GET /bff/usuarios
  2. BFF valida token vs ms-auth
  3. BFF llama GET /usuarios a ms-users
  4. ms-users retorna lista filtrada por estado=ACTIVO
  5. BFF retorna lista al cliente
Excepciones:
  - Token inválido → 401
  - ms-users caído → BFF intenta Redis; si no hay datos → 503

---

## 16. PATRONES APLICADOS EN MS-USERS

| Patrón              | Aplicación                                                  |
|---------------------|-------------------------------------------------------------|
| Repository Pattern  | Cada entidad tiene su propio repositorio Panache            |
| Service Layer       | Lógica de negocio centralizada, Resources solo delegan      |
| DTO Pattern         | Request/Response separados de las entidades JPA             |
| Entity Mapping      | toDTO() y fromDTO() explícitos en cada Service              |
| Database per Service| Única BD (db_users) solo accesible por ms-users             |
| Soft Delete         | Usuarios/Roles/Sucursales tienen activo=false (no se borran)|

---

## 17. LO QUE FALTA / PENDIENTE (tareas para Claude Code)

1. **Validaciones con @NotBlank / @NotNull en DTOs**
   - Agregar quarkus-hibernate-validator ya está en pom.xml pero los DTOs
     no tienen anotaciones de validación aún.
   - Agregar @Valid en los parámetros de los Resources.

2. **Manejo de errores unificado**
   - Crear ExceptionMapper global que retorne JSON estándar:
     { "error": "...", "mensaje": "...", "status": 409 }
   - Para NotFoundException, WebApplicationException, etc.

3. **Cambio de estrategia Hibernate en producción**
   - Cambiar drop-and-create → update antes de entregar.
   - O mejor: separar application.properties por perfil (%dev / %prod).

4. **Endpoint GET /usuarios/buscar documentado en Swagger**
   - Agregar @Parameter(description="...") al @QueryParam nombre.

5. **Paginación en listados**
   - GET /usuarios acepta @QueryParam page y size (opcional, mejora UX).

6. **Tests básicos**
   - Al menos un @QuarkusTest por Resource principal.
   - Usar @QuarkusTestResource con H2 o Testcontainers Postgres.

---

## 18. ESTRUCTURA DE CARPETAS ESPERADA

```
ms-users/
├── src/main/java/cl/duoc/cordillera/
│   ├── dto/
│   │   ├── UsuarioRequestDTO.java
│   │   ├── UsuarioUpdateRequestDTO.java
│   │   ├── UsuarioResponseDTO.java
│   │   ├── RolRequestDTO.java
│   │   ├── RolResponseDTO.java
│   │   ├── SucursalRequestDTO.java
│   │   ├── SucursalResponseDTO.java
│   │   ├── UsuarioRolRequestDTO.java
│   │   ├── UsuarioRolResponseDTO.java
│   │   ├── UsuarioSucursalRequestDTO.java
│   │   ├── UsuarioSucursalResponseDTO.java
│   │   ├── CiudadResponseDTO.java
│   │   └── RegionResponseDTO.java
│   ├── entity/
│   │   ├── Usuario.java
│   │   ├── Rol.java
│   │   ├── Sucursal.java
│   │   ├── Ciudad.java
│   │   ├── Region.java
│   │   ├── UsuarioRol.java
│   │   └── UsuarioSucursal.java
│   ├── enums/
│   │   ├── EstadoUsuario.java
│   │   └── NombreRol.java
│   ├── repository/
│   │   ├── UsuarioRepository.java
│   │   ├── RolRepository.java
│   │   ├── SucursalRepository.java
│   │   ├── CiudadRepository.java
│   │   ├── RegionRepository.java
│   │   ├── UsuarioRolRepository.java
│   │   └── UsuarioSucursalRepository.java
│   ├── resource/
│   │   ├── UsuarioResource.java
│   │   ├── RolResource.java
│   │   ├── SucursalResource.java
│   │   ├── CiudadResource.java
│   │   ├── RegionResource.java
│   │   ├── UsuarioRolResource.java
│   │   └── UsuarioSucursalResource.java
│   └── service/
│       ├── UsuarioService.java
│       ├── RolService.java
│       ├── SucursalService.java
│       ├── CiudadService.java
│       ├── RegionService.java
│       ├── UsuarioRolService.java
│       ├── UsuarioSucursalService.java
│       └── CatalogoGeograficoBootstrap.java
├── src/main/resources/
│   ├── application.properties
│   └── import.sql
├── src/test/java/cl/duoc/cordillera/
├── Dockerfile
├── docker-compose.yml
└── pom.xml
```

---

## 19. DEPENDENCIAS pom.xml (las relevantes)

```xml
<groupId>cl.duoc.cordillera</groupId>
<artifactId>ms-users</artifactId>
<version>1.0.0-SNAPSHOT</version>
<packaging>quarkus</packaging>

<!-- Quarkus BOM: 3.34.5 -->

<dependencies>
  quarkus-hibernate-validator
  quarkus-smallrye-openapi
  quarkus-rest-jackson
  quarkus-hibernate-orm-panache
  quarkus-jdbc-postgresql
  quarkus-arc
  quarkus-hibernate-orm
  quarkus-rest
  quarkus-junit (test)
  rest-assured (test)
</dependencies>
```

---

## 20. INSTRUCCIONES PARA CLAUDE CODE

Eres un asistente experto en Quarkus 3 y Java 21.
El proyecto ms-users ya tiene toda la base implementada.

Al recibir una tarea sobre ms-users:
1. Usa SIEMPRE el stack exacto definido en este contexto.
2. Las entidades JPA usan PanacheEntityBase con UUID como PK.
3. Nunca expongas entidades directamente — usa los DTOs existentes.
4. Los Services son @ApplicationScoped y @Transactional en métodos que modifican.
5. Los Resources no tienen lógica de negocio, solo llaman a los Services.
6. Todos los errores se lanzan como WebApplicationException o NotFoundException.
7. Sigue el patrón de código existente: toDTO(), fromDTO(), obtenerPorId().
8. Si necesitas crear algo nuevo, sigue la misma estructura de capas.
9. No agregues dependencias que no estén en el pom.xml sin mencionarlo.
10. El puerto es 8082, la base de datos es db_users en PostgreSQL 16.
```
