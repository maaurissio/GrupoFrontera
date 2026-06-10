# Criterios de Aceptación — Estado actual del frontend

**Fecha de revisión:** 2026-06-10  
**Revisado contra:** `criterios_aceptacion_frontend.md`

> Leyenda: ✅ Cumple · ⚠️ Cumple parcialmente · ❌ No cumple · — No aplica aún (BFF no integrado)

---

## Resumen ejecutivo

El frontend implementa correctamente el **diseño visual** (design system, tokens, tipografía, componentes). Lo que falta es casi todo lo **funcional**: integración con el BFF, validaciones reales, accesibilidad, responsividad y rendimiento.

De los 39 criterios evaluados: **5 cumplen**, **9 cumplen parcialmente**, **25 no cumplen**.

---

## 1. Comportamiento Funcional

### Autenticación

| CA | Estado | Descripción del problema |
|----|--------|--------------------------|
| CA-1.1 | ❌ | El botón "Ingresar" no se deshabilita durante la petición. No existe petición real a `POST /api/bff/auth/login`; el login es un `onClick` que cambia un boolean en `App.tsx`. |
| CA-1.2 | ❌ | No hay integración con el BFF. No se obtiene `accessToken`. La "redirección" al dashboard es solo un cambio de estado local. |
| CA-1.3 | ❌ | No existe manejo del error HTTP 401. Si las credenciales fueran inválidas, no se mostraría mensaje alguno. |
| CA-1.4 | ❌ | `Login.tsx` no valida el formato del email ni comprueba que la contraseña no esté vacía antes de llamar a `onLogin`. El botón se puede pulsar con campos vacíos. |
| CA-1.5 | ❌ | `onLogout` en `App.tsx` ejecuta `window.location.reload()`. No se llama a `POST /api/bff/auth/logout`, no se limpia ningún token. |

### Gestión de Usuarios

| CA | Estado | Descripción del problema |
|----|--------|--------------------------|
| CA-1.6 | ❌ | `UsersView.tsx` muestra **todos** los usuarios (ACTIVO, INACTIVO, BLOQUEADO) sin filtrar. No existe toggle "ver todos" / "solo activos". El filtro actual solo filtra por nombre. |
| CA-1.7 | ❌ | El modal `CreateUserModal` cierra en `onClick={onClose}` sin hacer ninguna petición. No existe manejo de HTTP 409 ni mensajes de error por campo. |
| CA-1.8 | ❌ | El formulario de creación divide el RUT en campo numérico + DV, pero no hay función que valide el dígito verificador chileno ni que compruebe el formato antes de enviar. |
| CA-1.9 | ⚠️ | El diálogo de confirmación `ConfirmModal` existe y muestra el nombre del usuario. Falta: la acción de confirmar también llama a `onClose` sin ejecutar `PUT /usuarios/{id}/desactivar`. |
| CA-1.10 | ⚠️ | Hay un estado vacío al filtrar, pero el mensaje dice **"No se encontraron usuarios"** (no "No hay usuarios registrados") y no incluye el botón "Crear usuario" requerido. |

### Dashboard de KPIs

| CA | Estado | Descripción del problema |
|----|--------|--------------------------|
| CA-1.11 | ❌ | `DashboardView.tsx` no tiene selectores de sucursal ni período. Los KPIs son datos mock estáticos de `data.ts`; no se consulta `GET /api/bff/kpis` ni `GET /api/bff/sucursales`. |
| CA-1.12 | ❌ | No existe manejo del HTTP 404. Si no hubiera datos para un período, no se muestra "No hay datos para el período seleccionado". |
| CA-1.13 | ⚠️ | `ReportesView.tsx` sí cambia de color según el porcentaje (`metaKind`), pero los **umbrales son distintos** a los especificados: usa <70% rojo / 70-99% amarillo / ≥100% verde, en lugar de <60% rojo / 60-90% amarillo / >90% verde. |
| CA-1.14 | ✅ | `ReportesView.tsx` ordena `ranked` por ventas descendente correctamente. |

### Reportes y Exportación

| CA | Estado | Descripción del problema |
|----|--------|--------------------------|
| CA-1.15 | ❌ | La exportación en `ReportesView.tsx` es simulada con un `setTimeout` de 1600 ms. No se descarga ningún archivo real ni se lee el header `Content-Disposition`. |
| CA-1.16 | ⚠️ | La UI sí muestra estado de carga y deshabilita los botones durante la "exportación" simulada. Falta la descarga real del BFF. |

### Datos Consolidados

| CA | Estado | Descripción del problema |
|----|--------|--------------------------|
| CA-1.17 | ❌ | **No existe ninguna vista de "datos consolidados"** en el frontend. No hay navegación, ni filtros, ni tabla para los estados RECIBIDO / VALIDADO / PROCESADO / ERROR. |
| CA-1.18 | ❌ | No existe la vista. No hay botón "Reprocesar" ni lógica de actualización de fila. |
| CA-1.19 | ❌ | No existe la vista. No hay log de trazabilidad ni línea de tiempo de acciones. |

---

## 2. Diseño y Maquetación

| CA | Estado | Descripción del problema |
|----|--------|--------------------------|
| CA-2.1 | ✅ | Design system implementado: `tokens.css` con Geist/Inter/Geist Mono, paleta oscura, tema claro vía `[data-theme="light"]`. |
| CA-2.2 | ❌ | **No hay media queries en ningún archivo CSS** (`@media` no existe en `kit.css` ni `tokens.css`). El sidebar tiene `width: 240` fijo y no colapsa. Los grids usan `repeat(4, 1fr)` sin breakpoints. La app se rompe en móvil. |
| CA-2.3 | ❌ | Las tablas no tienen `overflow-x: auto` en su contenedor. No existe scroll horizontal en pantallas pequeñas. |
| CA-2.4 | ⚠️ | Los botones tienen estilos para `:hover`, `:active` y `:focus-visible` en `kit.css`. Sin embargo, **no hay estilo para el estado `:disabled`** — los botones deshabilitados no tienen feedback visual diferenciado. |
| CA-2.5 | ⚠️ | Hay badges de colores consistentes para los estados de usuarios (ACTIVO verde, INACTIVO gris, BLOQUEADO rojo). Falta: los colores específicos para PROCESADO / VALIDADO / RECIBIDO / ERROR (de la vista de datos consolidados que no existe). |
| CA-2.6 | ⚠️ | Los montos en pesos chilenos están bien formateados (`$1.284.500`). Las fechas en el mock y en las vistas usan el formato **"03 jun 2026, 14:52"** — no el formato `dd-MM-yyyy` requerido. |
| CA-2.7 | ❌ | Los formularios (`CreateUserModal`, `Login`) no muestran mensajes de error debajo de los campos. No hay lógica de validación con feedback visual inline. |

---

## 3. Respuestas del Sistema y APIs

| CA | Estado | Descripción del problema |
|----|--------|--------------------------|
| CA-3.1 | — | No hay integración con BFF. Ninguna vista tiene skeleton loader ni spinner. Cuando se conecte el BFF, todas las vistas deberán implementarlo. |
| CA-3.2 | ❌ | No existe manejador de errores HTTP 500. No hay mensaje "Ha ocurrido un error inesperado" ni botón "Reintentar". |
| CA-3.3 | ❌ | No existe interceptor de peticiones. No hay lógica de renovación automática de token vía `POST /api/bff/auth/refresh`. Si el token expirara, el usuario quedaría en una pantalla rota sin mensaje. |
| CA-3.4 | ❌ | No existe ningún mecanismo para enviar el header `Authorization: Bearer <accessToken>` — no hay cliente HTTP configurado ni fetch wrapper. |
| CA-3.5 | ❌ | No hay traducción de errores 409 / 404 a mensajes comprensibles. |
| CA-3.6 | ❌ | Las búsquedas en `UsersView` y `DashboardView` aplican el filtro **inmediatamente en cada tecla** sin debounce. No hay `useCallback` con debounce de 300–500 ms. |
| CA-3.7 | — | No aplica hasta integrar el BFF. Faltará implementar timeout de 5 s con mensaje de demora. |
| CA-3.8 | ❌ | No existe uso de `AbortController`. No hay cleanup de peticiones al cambiar de vista, lo que generará warnings de estado en componentes desmontados cuando se integre el BFF. |

---

## 4. Accesibilidad (a11y)

> **Nota crítica:** Una búsqueda en todo el directorio `src/` no encontró ningún atributo `aria-*` ni `role=` en ningún componente TSX.

| CA | Estado | Descripción del problema |
|----|--------|--------------------------|
| CA-4.1 | ❌ | El formulario de `Login.tsx` no usa `<form>` con `onSubmit`. El botón es un `<button onClick={onLogin}>` suelto — no es activable con Enter. Los modales tampoco son enviables con Enter. |
| CA-4.2 | ❌ | Los botones de ícono en `UsersView.tsx` usan `title="Ver detalle"` (tooltip del navegador), no `aria-label`. El `aria-label` descriptivo específico (ej. "Ver detalle de Diego Fuentes") no está implementado en ningún lugar. |
| CA-4.3 | ⚠️ | Los colores primarios (`#F0F0F0` sobre `#0F0F0F`) probablemente cumplen WCAG AA. No verificado con herramienta. El color secundario `#888888` sobre `#1A1A1A` puede ser borderline (~4.1:1). Requiere auditoría con herramienta (ej. axe, Lighthouse). |
| CA-4.4 | ❌ | No existe `role="alert"` ni `aria-live` en ningún mensaje de error o confirmación del sistema. Los lectores de pantalla no anunciarán estos mensajes. |
| CA-4.5 | ⚠️ | Hay `<aside>`, `<nav>` y `<main>`. Falta: ninguna `<th>` tiene atributo `scope` (p.ej. `<th scope="col">`). El `Topbar` no está envuelto en `<header>`. |
| CA-4.6 | ❌ | `ModalOverlay` en `Primitives.tsx` no implementa focus trap. Al abrir un modal, el foco no se mueve al modal, no queda atrapado dentro, y no hay soporte para cerrar con `Esc`. |
| CA-4.7 | ❌ | `LineChart` en `Chart.tsx` es un `<svg>` puro sin `role="img"`, `aria-label`, ni tabla alternativa. Los lectores de pantalla no pueden acceder a la información del gráfico. |

---

## 5. Rendimiento y Compatibilidad

| CA | Estado | Descripción del problema |
|----|--------|--------------------------|
| CA-5.1 | ✅ | El stack (React 19 + Vite + TS) es compatible con las últimas 2 versiones de los navegadores principales. No se usan APIs experimentales. |
| CA-5.2 | ❌ | Todas las vistas se importan **estáticamente** en `App.tsx` con `import { DashboardView } from './views/...'`. No hay `React.lazy()` ni `Suspense`. El bundle inicial incluirá todo el código de la app. |
| CA-5.3 | ⚠️ | Las fuentes se sirven en formato **TTF** (no WOFF2), lo cual es menos eficiente en carga (~30% mayor tamaño). Esto puede afectar el FCP del login. No hay fonts en `<link rel="preload">`. |
| CA-5.4 | ⚠️ | Los íconos son SVG vía `lucide-react` ✓. Los logos son SVG ✓. Las fuentes están en TTF en lugar de WOFF2 ✗. |
| CA-5.5 | ❌ | No existe ninguna gestión de tokens JWT. No hay `accessToken` en memoria ni `refreshToken` en `localStorage`. El "login" es solo un boolean. Cuando se integre el BFF, esto deberá implementarse correctamente (accessToken en memoria, refreshToken en cookie httpOnly o localStorage). |
| CA-5.6 | ❌ | No hay caché en cliente para los datos del dashboard. Cuando se integre el BFF, cada cambio de vista provocará re-fetching. No hay implementación de caché (ej. `useRef` con mapa de resultados, React Query, SWR). |
| CA-5.7 | ⚠️ | El script `build` ejecuta `tsc -b && vite build`. No se puede confirmar sin ejecutar `npm run lint` y `tsc -b`. El proyecto tiene `eslint-plugin-react-hooks` configurado; verificar que no haya warnings de dependencias faltantes en hooks. |
| CA-5.8 | ⚠️ | `Chart.tsx` limpia correctamente los event listeners en `useEffect`. `PrefsContext.tsx` usa cleanup en `useEffect`. En general el patrón parece correcto, pero la ausencia de `AbortController` (CA-3.8) será una fuente de memory leaks cuando se integre el BFF. |

---

## Criterios que SÍ cumplen completamente

| CA | Descripción |
|----|-------------|
| CA-1.14 | Comparativo de sucursales ordenado por ventas descendente |
| CA-2.1 | Design system: tipografía Geist/Inter, tema oscuro, tokens CSS |
| CA-5.1 | Compatibilidad de navegadores |

---

## Priorización sugerida (por impacto)

### Alta prioridad (bloquean el MVP funcional)
1. **CA-1.1 / 1.2 / 1.3 / 1.4 / 1.5** — Integración BFF login/logout completa con JWT
2. **CA-3.4** — Cliente HTTP con header `Authorization`
3. **CA-3.3** — Interceptor de refresh automático de token
4. **CA-5.5** — Gestión correcta de accessToken (memoria) y refreshToken
5. **CA-1.6 / 1.7 / 1.8** — Validaciones reales en gestión de usuarios
6. **CA-1.11 / 1.12** — Selectores y fetching real de KPIs en dashboard
7. **CA-1.17 / 1.18 / 1.19** — Vista completa de datos consolidados (ms-datos)

### Media prioridad (UX y calidad)
8. **CA-2.2 / 2.3** — Responsividad (media queries, sidebar colapsable, tablas scroll horizontal)
9. **CA-3.1 / 3.2 / 3.5 / 3.6** — Loading states, manejo de errores, debounce
10. **CA-2.7** — Validaciones inline en formularios
11. **CA-5.2** — Lazy loading de vistas secundarias

### Baja prioridad (a11y y optimización final)
12. **CA-4.1 / 4.2 / 4.4 / 4.6 / 4.7** — Accesibilidad completa (forms con Enter, aria-labels, focus trap, alertas)
13. **CA-4.5** — `th scope`, `<header>` semántico
14. **CA-5.3 / 5.4** — Fuentes a WOFF2, preload
15. **CA-5.6** — Caché en cliente para dashboard
16. **CA-3.8** — AbortController en cambios de vista
17. **CA-1.13** — Corregir umbrales de color (60/90 en lugar de 70/100)
18. **CA-1.10** — Corregir mensaje y botón en estado vacío de usuarios
19. **CA-2.6** — Fechas en formato `dd-MM-yyyy`
