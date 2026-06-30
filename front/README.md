# front — Interfaz Web

SPA de la plataforma Grupo Frontera. **React 19 + Vite + TypeScript**. Consume
exclusivamente la API del **BFF** (`http://localhost:8090`).

## ¿Qué hace?

Interfaz de monitoreo con control de acceso por rol. Vistas principales:

| Vista | Descripción |
|-------|-------------|
| Dashboard | KPIs reales por sucursal y alcance (mes / todos) |
| Reportes | Comparativo + gráfico por rango de meses, exportar informes, editar KPIs |
| Usuarios | CRUD de usuarios, validación de RUT, asignación de sucursales |
| Roles | Matriz de permisos (6 módulos × 4 niveles) |
| Sucursales | CRUD + mapa (MapLibre) con detalle y ruta (OSRM) |
| Productos | Catálogo, filtros, importar JSON, exportar inventario |
| Reportes guardados | Historial, favoritos, regenerar descarga |
| Configuración | Tema claro / oscuro |

### Control de acceso

Centralizado en `utils/permisos.ts` y aplicado en 3 capas: `Sidebar` (oculta nav),
`App.tsx` (vistas restringidas) y dentro de cada vista (botones).

- Ver usuarios y roles → solo **ADMIN**
- Gestionar sucursales → **ADMIN** y **SOPORTE**
- Editar KPIs → **ADMIN** y **GERENTE**

## Estructura

```
src/
├── api/        # capa de acceso al BFF (client.ts, auth.ts, usuarios.ts, ...)
├── components/ # Sidebar, Chart, Primitives, modales, Icon
├── context/    # AuthContext (tokens), PrefsContext (tema/densidad)
├── hooks/      # useDebounce
├── utils/      # rut.ts, periodo.ts, permisos.ts
└── views/      # las vistas de la tabla anterior
```

- `api/client.ts`: wrapper de `fetch` con header `Authorization`, auto-refresh ante 401 y
  `AbortController`.
- `AuthContext`: `accessToken` en memoria, `refreshToken` en `localStorage`.

## Requisitos

- **Node.js** (con npm). El backend (BFF + microservicios) debe estar accesible para los
  datos; levántalo con `docker compose up -d` desde la raíz del repo.

## Ejecutar individualmente

```bash
cd front
npm install        # instalar dependencias
npm run dev        # servidor de desarrollo → http://localhost:5173
npm run build      # build de producción (tsc + vite)
npm run preview    # previsualizar el build
```

En desarrollo, el front espera el BFF en `http://localhost:8090` (CORS ya habilitado en
el BFF para `http://localhost:5173`).

### En Docker

El contenedor compila con Vite y se sirve con **nginx**:

```bash
docker compose up -d --build front   # disponible en http://localhost:5173
```

## Tests

```bash
npm test                 # vitest run con cobertura
npm run test:coverage    # idem (alias)
```

Los tests cubren la lógica de negocio en `utils/`: validación de RUT (módulo 11 chileno),
rangos de períodos y permisos por rol. La config de vitest está separada en
`vitest.config.ts` y el setup (`src/test/setup.ts`) incluye un polyfill de `localStorage`.

## Stack

React 19 · Vite · TypeScript · MapLibre GL (mapas) · lucide-react (iconos) ·
Vitest + React Testing Library (tests).

### Sistema de diseño

Paleta oscura: `#0F0F0F` base → `#1A1A1A` sidebar → `#1E1E1E` tarjetas. Fuentes: **Geist**
(títulos), **Inter** (cuerpo), **Geist Mono** (números/KPIs). Tema claro vía
`[data-theme="light"]`.
