export const DATA = {
  chart: {
    months: ["Ene", "Feb", "Mar", "Abr", "May", "Jun"],
    ventas: [38.2, 41.0, 39.6, 46.4, 43.1, 50.8],
    tx:     [1420, 1510, 1486, 1690, 1602, 1842],
  },

  ventasRecientes: [
    { id: "V-90421", sucursal: "Santiago Centro", vendedor: "Diego Fuentes",   monto: "$320.000",   ago: "hace 8 min",   full: "03 jun 2026, 14:52" },
    { id: "V-90420", sucursal: "Providencia",     vendedor: "Antonia Vega",    monto: "$148.500",   ago: "hace 21 min",  full: "03 jun 2026, 14:39" },
    { id: "V-90419", sucursal: "Valparaíso",      vendedor: "Valentina Soto",  monto: "$92.990",    ago: "hace 34 min",  full: "03 jun 2026, 14:26" },
    { id: "V-90418", sucursal: "Concepción",      vendedor: "Matías Herrera",  monto: "$1.249.000", ago: "hace 1 hora",  full: "03 jun 2026, 13:58" },
    { id: "V-90417", sucursal: "Santiago Centro", vendedor: "Diego Fuentes",   monto: "$58.500",    ago: "hace 2 horas", full: "03 jun 2026, 12:44" },
    { id: "V-90416", sucursal: "Viña del Mar",    vendedor: "Camila Rojas",    monto: "$214.300",   ago: "hace 2 horas", full: "03 jun 2026, 12:31" },
    { id: "V-90415", sucursal: "Talcahuano",      vendedor: "Pedro Núñez",     monto: "$36.990",    ago: "hace 3 horas", full: "03 jun 2026, 11:50" },
    { id: "V-90414", sucursal: "Providencia",     vendedor: "Antonia Vega",    monto: "$489.000",   ago: "hace 3 horas", full: "03 jun 2026, 11:22" },
    { id: "V-90413", sucursal: "Valparaíso",      vendedor: "Valentina Soto",  monto: "$77.500",    ago: "hace 4 horas", full: "03 jun 2026, 10:48" },
    { id: "V-90412", sucursal: "Concepción",      vendedor: "Matías Herrera",  monto: "$162.000",   ago: "hace 5 horas", full: "03 jun 2026, 09:31" },
  ],

  modules: [
    { id: "reportes",   title: "Reporte de ventas",    desc: "KPIs por sucursal y período",   icon: "bar-chart-3", route: "reportes",   status: "OPERATIVO", kind: "success" as const },
    { id: "inventario", title: "Control de inventario", desc: "Stock y alertas de quiebre",   icon: "package",     route: "inventario", status: "DEGRADADO", kind: "warning" as const },
    { id: "sucursales", title: "Red de sucursales",    desc: "Ubicación y cobertura",         icon: "map-pin",     route: "sucursales", status: "OPERATIVO", kind: "success" as const },
    { id: "usuarios",   title: "Gestión de usuarios",  desc: "Roles y asignaciones",          icon: "users",       route: "usuarios",   status: "OPERATIVO", kind: "success" as const },
  ],

  inventario: [
    { sku: "TEC-4471", name: "Smart TV 55\" UHD",           cat: "Tecnología", branch: "Concepción",      pres: 1,  online: 1,  min: 8,  kind: "crit" as const },
    { sku: "HOG-2204", name: "Lavadora Carga Frontal 9kg",  cat: "Hogar",      branch: "Concepción",      pres: 0,  online: 1,  min: 5,  kind: "crit" as const },
    { sku: "HOG-1182", name: "Refrigerador No Frost 320L",  cat: "Hogar",      branch: "Valparaíso",      pres: 3,  online: 2,  min: 6,  kind: "warn" as const },
    { sku: "TEC-3390", name: "Notebook 14\" 16GB",          cat: "Tecnología", branch: "Valparaíso",      pres: 2,  online: 2,  min: 10, kind: "warn" as const },
    { sku: "TEC-1120", name: "Microondas 25L Digital",      cat: "Tecnología", branch: "Talcahuano",      pres: 4,  online: 3,  min: 8,  kind: "warn" as const },
    { sku: "TEC-5567", name: "Audífonos In-Ear BT",         cat: "Tecnología", branch: "Santiago Centro", pres: 28, online: 14, min: 20, kind: "ok"   as const },
    { sku: "HOG-8890", name: "Set Sartenes Antiadherente",  cat: "Hogar",      branch: "Providencia",     pres: 40, online: 24, min: 25, kind: "ok"   as const },
    { sku: "HOG-3315", name: "Aspiradora Ciclónica 2.0",    cat: "Hogar",      branch: "Santiago Centro", pres: 18, online: 9,  min: 12, kind: "ok"   as const },
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

  categorias: ["Tecnología", "Hogar"],

  branchNames: [
    "Santiago Centro", "Providencia", "Valparaíso",
    "Viña del Mar", "Concepción", "Talcahuano",
  ],

  reportesGuardados: [
    { id: "RPT-001", nombre: "Resumen mensual — Grupo",          periodo: "Mayo 2026",      sucursal: "Todas",                formato: "PDF",   fecha: "01 jun 2026, 08:00", estado: "Generado"   as const, fav: true,  programado: true,  frecuencia: "Mensual" },
    { id: "RPT-002", nombre: "Ventas Santiago Centro",           periodo: "Mayo 2026",      sucursal: "Santiago Centro",      formato: "Excel", fecha: "01 jun 2026, 08:15", estado: "Generado"   as const, fav: true,  programado: false },
    { id: "RPT-003", nombre: "Stock crítico consolidado",        periodo: "Semana 22",      sucursal: "Todas",                formato: "PDF",   fecha: "30 may 2026, 09:00", estado: "Generado"   as const, fav: false, programado: true,  frecuencia: "Semanal" },
    { id: "RPT-004", nombre: "Comparativo Valparaíso vs Viña",  periodo: "Q1 2026",        sucursal: "Valparaíso, Viña",     formato: "Excel", fecha: "15 abr 2026, 14:30", estado: "Generado"   as const, fav: false, programado: false },
    { id: "RPT-005", nombre: "Reporte semanal Concepción",       periodo: "Semana 23",      sucursal: "Concepción",           formato: "PDF",   fecha: "03 jun 2026, 07:00", estado: "En proceso" as const, fav: false, programado: true,  frecuencia: "Semanal" },
    { id: "RPT-006", nombre: "KPIs directorio H1",               periodo: "Ene – Jun 2026", sucursal: "Todas",                formato: "PDF",   fecha: "02 jun 2026, 10:00", estado: "Error"      as const, fav: false, programado: false },
  ],

  auditLog: [
    { fecha: "03 jun 2026, 14:52", usuario: "Diego Fuentes",  accion: "Registró venta V-90421",           detalle: "Santiago Centro · $320.000" },
    { fecha: "03 jun 2026, 14:39", usuario: "Antonia Vega",   accion: "Registró venta V-90420",           detalle: "Providencia · $148.500" },
    { fecha: "03 jun 2026, 12:15", usuario: "Camila Rojas",   accion: "Exportó reporte RPT-001",          detalle: "PDF · Resumen mensual" },
    { fecha: "03 jun 2026, 11:00", usuario: "Camila Rojas",   accion: "Creó usuario Pedro Núñez",         detalle: "Rol: Vendedor · Talcahuano" },
    { fecha: "02 jun 2026, 16:40", usuario: "Matías Herrera", accion: "Actualizó stock TEC-4471",         detalle: "Smart TV 55\" · +5 unidades" },
    { fecha: "02 jun 2026, 09:30", usuario: "Camila Rojas",   accion: "Desactivó usuario Antonia Vega",   detalle: "Estado: INACTIVO" },
    { fecha: "01 jun 2026, 08:00", usuario: "Sistema",        accion: "Generó reporte programado RPT-001",detalle: "Resumen mensual — Grupo" },
    { fecha: "31 may 2026, 17:00", usuario: "Valentina Soto", accion: "Editó sucursal Valparaíso",        detalle: "Cambió dirección" },
  ],

  sesiones: [
    { dispositivo: "Chrome · macOS",  ip: "192.168.1.42", inicio: "03 jun 2026, 08:12", actual: true  },
    { dispositivo: "Safari · iPhone", ip: "192.168.1.88", inicio: "02 jun 2026, 19:30", actual: false },
  ],

  integraciones: [
    { nombre: "POS Central",    desc: "Sistema de punto de venta",   estado: "Conectado",    kind: "success" as const, icon: "zap",      ultimaSync: "hace 2 min"  },
    { nombre: "ERP Financiero", desc: "Contabilidad y facturación",  estado: "Conectado",    kind: "success" as const, icon: "database", ultimaSync: "hace 15 min" },
    { nombre: "WMS Bodega",     desc: "Gestión de almacén",          estado: "Desconectado", kind: "danger"  as const, icon: "boxes",    ultimaSync: "hace 3 días"  },
    { nombre: "Email SMTP",     desc: "Envío de reportes por correo",estado: "Conectado",    kind: "success" as const, icon: "activity", ultimaSync: "hace 1 hora" },
  ],

  nav: [
    { id: "dashboard",  label: "Resumen",           icon: "layout-dashboard" },
    { id: "reportes",   label: "Reportes",           icon: "bar-chart-3" },
    { id: "datos",      label: "Datos",              icon: "database",          badge: 0 },
    { id: "inventario", label: "Inventario",         icon: "package",           badge: 7 },
    { id: "usuarios",   label: "Usuarios",           icon: "users" },
    { id: "sucursales", label: "Sucursales",         icon: "map-pin" },
  ],
};

export type ViewId = "dashboard" | "reportes" | "inventario" | "usuarios" | "sucursales" | "reportesGuardados" | "configuracion" | "datos";
