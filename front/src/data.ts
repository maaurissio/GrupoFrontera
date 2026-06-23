export const DATA = {
  chart: {
    months: ["Ene", "Feb", "Mar", "Abr", "May", "Jun"],
    ventas: [38.2, 41.0, 39.6, 46.4, 43.1, 50.8],
    tx:     [1420, 1510, 1486, 1690, 1602, 1842],
  },

  modules: [
    { id: "reportes",   title: "Reporte de ventas",   desc: "KPIs por sucursal y período",  icon: "bar-chart-3", route: "reportes",   status: "OPERATIVO", kind: "success" as const },
    { id: "sucursales", title: "Red de sucursales",   desc: "Ubicación y cobertura",         icon: "map-pin",     route: "sucursales", status: "OPERATIVO", kind: "success" as const },
    { id: "usuarios",   title: "Gestión de usuarios", desc: "Roles y asignaciones",          icon: "users",       route: "usuarios",   status: "OPERATIVO", kind: "success" as const },
  ],

  roleMeta: {
    GERENTE:       { label: "Gerente",       kind: "info"    as const },
    ADMIN:         { label: "Admin",         kind: "danger"  as const },
    JEFE_SUCURSAL: { label: "Jefe sucursal", kind: "yellow"  as const },
    ANALISTA:      { label: "Analista",      kind: "neutral" as const },
    SOPORTE:       { label: "Soporte",       kind: "orange"  as const },
    VENDEDOR:      { label: "Vendedor",      kind: "neutral" as const },
  } as Record<string, { label: string; kind: string }>,

  estadoMeta: {
    ACTIVO:    { kind: "success" as const },
    INACTIVO:  { kind: "neutral" as const },
    BLOQUEADO: { kind: "danger"  as const },
  } as Record<string, { kind: string }>,

  nav: [
    { id: "dashboard",  label: "Resumen",   icon: "layout-dashboard" },
    { id: "reportes",   label: "Reportes",  icon: "bar-chart-3" },
    { id: "productos",  label: "Productos", icon: "package",    badge: 0 },
    { id: "usuarios",   label: "Usuarios",  icon: "users" },
    { id: "sucursales", label: "Sucursales", icon: "map-pin" },
  ],
};

export type ViewId = "dashboard" | "reportes" | "usuarios" | "sucursales" | "configuracion" | "productos";
