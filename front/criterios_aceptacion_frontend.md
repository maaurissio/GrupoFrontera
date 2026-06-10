# Criterios de Aceptación — Frontend
## Plataforma de Monitoreo Gerencial · Grupo Cordillera S.A.

**Stack:** React 19 + TypeScript + Vite · BFF Quarkus (puerto 8090) · Autenticación JWT + Refresh Token

---

## 1. Comportamiento Funcional (Lógica de UI)

### Autenticación (Login)
- **CA-1.1** — El botón "Iniciar sesión" debe deshabilitarse mientras la petición `POST /api/bff/auth/login` está en curso, para evitar envíos duplicados.
- **CA-1.2** — Si el login es exitoso (HTTP 200), el usuario debe ser redirigido al Dashboard principal y el `accessToken` debe quedar disponible para las siguientes peticiones.
- **CA-1.3** — Si las credenciales son inválidas (HTTP 401), debe mostrarse el mensaje "Correo o contraseña incorrectos" sin recargar la página ni limpiar el campo de email.
- **CA-1.4** — El formulario debe validar en cliente que el email tenga formato válido y que la contraseña no esté vacía antes de llamar a la API.
- **CA-1.5** — Al hacer logout, debe invocarse `POST /api/bff/auth/logout` con el refreshToken, limpiarse el estado de sesión y redirigir al login.

### Gestión de Usuarios
- **CA-1.6** — El listado de usuarios (`GET /api/bff/usuarios`) debe mostrar solo usuarios con estado ACTIVO por defecto, con opción de alternar a "ver todos".
- **CA-1.7** — Al crear un usuario, si el RUT o email ya existen (HTTP 409), debe mostrarse el error específico junto al campo correspondiente, conservando los demás datos del formulario.
- **CA-1.8** — El formulario de creación debe validar el RUT chileno (formato y dígito verificador) antes de enviar.
- **CA-1.9** — Al desactivar un usuario debe mostrarse un diálogo de confirmación ("¿Desactivar a [nombre]?") antes de ejecutar `PUT /usuarios/{id}/desactivar`.
- **CA-1.10** — Si la lista de usuarios está vacía, mostrar el estado vacío: "No hay usuarios registrados" con un botón de acción "Crear usuario".

### Dashboard de KPIs
- **CA-1.11** — El dashboard debe requerir la selección de sucursal y período (formato YYYY-MM) antes de consultar `GET /api/bff/kpis`; los selectores deben poblarse desde `GET /api/bff/sucursales`.
- **CA-1.12** — Si no existen KPIs para la combinación sucursal/período (HTTP 404), mostrar "No hay datos para el período seleccionado" en lugar de tarjetas vacías o con ceros engañosos.
- **CA-1.13** — El indicador de % de cumplimiento debe cambiar de color según el valor: rojo (< 60%), amarillo (60–90%), verde (> 90%).
- **CA-1.14** — La vista comparativa (`/kpis/comparativo`) debe ordenar las sucursales por total de ventas de mayor a menor.

### Reportes y Exportación
- **CA-1.15** — El botón "Exportar PDF" / "Exportar Excel" debe descargar el archivo con el nombre `reporte_sucursal{id}_{periodo}.{ext}` tal como lo entrega el header `Content-Disposition` del BFF.
- **CA-1.16** — Durante la generación del archivo, el botón de exportación debe mostrar estado de carga y bloquearse hasta completar la descarga.

### Datos Consolidados
- **CA-1.17** — La vista de datos debe permitir filtrar por sucursal, tipo de dato, rango de períodos y estado (RECIBIDO, VALIDADO, PROCESADO, ERROR), reflejando los filtros como query params en la URL.
- **CA-1.18** — Los registros en estado ERROR deben mostrar un botón "Reprocesar"; al usarlo, la fila debe actualizar su estado sin recargar toda la tabla.
- **CA-1.19** — Al expandir un registro debe consultarse su log de trazabilidad (`GET /datos/{id}/log`) y mostrarse la línea de tiempo de acciones (RECIBIDO → VALIDADO → PROCESADO/ERROR).

---

## 2. Diseño y Maquetación (UI/UX)

- **CA-2.1** — La aplicación debe implementar el design system definido: tipografía **Geist** para títulos e **Inter** para texto, sobre tema oscuro con los tokens de color especificados.
- **CA-2.2** — El layout debe ser responsive: el menú lateral de navegación debe colapsar en un ícono de hamburguesa en pantallas menores a 768 px, y las tarjetas de KPIs deben pasar de grilla de 4 columnas a 2 (tablet) y 1 (móvil).
- **CA-2.3** — Las tablas (usuarios, datos consolidados) deben permitir scroll horizontal en móvil sin romper el layout de la página.
- **CA-2.4** — Botones e inputs deben tener estados visuales diferenciados: normal, hover, focus, active y disabled, con transición suave (≤ 200 ms).
- **CA-2.5** — Los estados de los datos deben usar badges con colores consistentes en toda la app: PROCESADO (verde), VALIDADO (azul), RECIBIDO (gris), ERROR (rojo).
- **CA-2.6** — Los montos deben formatearse en pesos chilenos (`$1.234.567`) y las fechas en formato `dd-MM-yyyy`, consistente en todas las vistas.
- **CA-2.7** — Los formularios deben mostrar los errores de validación debajo del campo correspondiente, en color de error del design system, sin desplazar bruscamente el resto del contenido.

---

## 3. Respuestas del Sistema y APIs

- **CA-3.1** — Toda vista que consuma el BFF debe mostrar un indicador de carga (skeleton o spinner) mientras la petición está pendiente; nunca una pantalla en blanco.
- **CA-3.2** — Ante un error 500 del BFF o de un microservicio caído, mostrar el mensaje "Ha ocurrido un error inesperado. Intente más tarde" con opción de "Reintentar", sin exponer detalles técnicos del stack.
- **CA-3.3** — Si una petición retorna 401 (token expirado), el frontend debe intentar renovar la sesión automáticamente vía `POST /api/bff/auth/refresh`; si el refresh también falla, redirigir al login con el mensaje "Tu sesión ha expirado".
- **CA-3.4** — Las peticiones al BFF deben incluir el header `Authorization: Bearer <accessToken>` en todas las rutas protegidas.
- **CA-3.5** — Los errores 409 (conflictos de unicidad) y 404 (recurso no encontrado) deben traducirse a mensajes específicos y comprensibles para el usuario, distintos del error genérico.
- **CA-3.6** — Las búsquedas y filtros deben aplicar debounce de 300–500 ms para no saturar el BFF con peticiones por cada tecla.
- **CA-3.7** — La respuesta de los filtros del dashboard debe reflejarse en pantalla en menos de 2 segundos en condiciones normales de red; si supera los 5 segundos, mostrar mensaje de demora.
- **CA-3.8** — Si una petición se cancela (cambio de vista), no deben quedar actualizaciones de estado pendientes que generen warnings o datos de la vista anterior.

---

## 4. Accesibilidad (a11y)

- **CA-4.1** — Todos los formularios (login, usuarios, filtros) deben ser completamente navegables con la tecla `Tab`, en orden lógico, y enviables con `Enter`.
- **CA-4.2** — Los botones de solo ícono (editar, desactivar, exportar) deben incluir `aria-label` descriptivo (ej. "Desactivar usuario María Gerente").
- **CA-4.3** — El contraste texto/fondo debe cumplir WCAG 2.1 AA (mínimo 4.5:1 para texto normal), especialmente relevante en el tema oscuro.
- **CA-4.4** — Los mensajes de error y confirmación deben anunciarse a lectores de pantalla mediante `role="alert"` o `aria-live="polite"`.
- **CA-4.5** — La estructura debe usar HTML semántico: `<header>`, `<nav>`, `<main>`, `<table>` con `<th scope>`, y un único `<h1>` por vista.
- **CA-4.6** — El foco visible (outline) no debe eliminarse; al abrir un modal, el foco debe moverse al modal y quedar atrapado en él hasta cerrarlo (con `Esc` también).
- **CA-4.7** — Los gráficos de KPIs deben tener una alternativa textual (tabla o resumen) accesible para lectores de pantalla.

---

## 5. Rendimiento y Compatibilidad

- **CA-5.1** — La aplicación debe visualizarse y funcionar correctamente en las últimas dos versiones de Chrome, Firefox, Edge y Safari.
- **CA-5.2** — El bundle inicial de producción (`npm run build`) no debe superar los 300 KB gzip; las vistas secundarias (reportes, administración) deben cargarse mediante lazy loading / code splitting por ruta.
- **CA-5.3** — El First Contentful Paint del login debe ser menor a 1.5 s y el dashboard debe ser interactivo (TTI) en menos de 3 s en una conexión 4G estándar.
- **CA-5.4** — Las imágenes y assets estáticos deben servirse optimizados (SVG para íconos, WebP para imágenes, ≤ 150 KB cada una).
- **CA-5.5** — El `accessToken` debe mantenerse en memoria (estado de la aplicación) y solo el `refreshToken` persistirse; no debe almacenarse el access token en `localStorage` por riesgo de XSS.
- **CA-5.6** — Los datos del dashboard ya consultados (misma sucursal/período) deben cachearse en cliente durante la sesión para evitar peticiones redundantes al volver a la vista.
- **CA-5.7** — El proyecto debe pasar `npm run lint` y `tsc -b` sin errores antes de cada build de producción.
- **CA-5.8** — La aplicación no debe presentar memory leaks: listeners y suscripciones deben limpiarse al desmontar componentes (verificable con React StrictMode activo, ya configurado en `main.tsx`).
