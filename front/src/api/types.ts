export interface UsuarioDTO {
  id: string;
  rut: string;
  dv: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  estado: 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO';
  roles: string[];
  sucursales: string[];
}

export type NombreRol =
  | 'ADMIN' | 'CLIENTE' | 'VENDEDOR' | 'SOPORTE' | 'GERENTE'
  | 'LOGISTICA' | 'RRHH' | 'CONTABILIDAD' | 'OPERADOR' | 'SUPERVISOR';

export const NOMBRES_ROL: { value: NombreRol; label: string }[] = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'CLIENTE', label: 'Cliente' },
  { value: 'VENDEDOR', label: 'Vendedor' },
  { value: 'SOPORTE', label: 'Soporte' },
  { value: 'GERENTE', label: 'Gerente' },
  { value: 'LOGISTICA', label: 'Logística' },
  { value: 'RRHH', label: 'RRHH' },
  { value: 'CONTABILIDAD', label: 'Contabilidad' },
  { value: 'OPERADOR', label: 'Operador' },
  { value: 'SUPERVISOR', label: 'Supervisor' },
];

export interface RolDTO {
  id: string;
  nombre: NombreRol;
  descripcion: string | null;
}

export interface RolCreatePayload {
  nombre: NombreRol;
  descripcion: string | null;
}

export interface SucursalDTO {
  id: number;
  codigo: string;
  nombre: string;
  ciudad: string;
  ciudadId?: number | null;
  habilitada: boolean;
  latitud?: number | null;
  longitud?: number | null;
}

// Asignación usuario↔sucursal (ms-users); el BFF agrega `sucursalNombre`.
export interface AsignacionSucursalDTO {
  id: string;            // UUID de la asignación (para desasignar)
  usuarioId: string;
  nombreUsuario: string;
  sucursalId: number;    // id de la sucursal en ms-datos
  sucursalNombre?: string;
  asignadoEn: string;
}

export interface RegionDTO {
  id: number;
  nombre: string;
}

export interface CiudadDTO {
  id: number;
  nombre: string;
  regionId: number;
  regionNombre: string;
}

export interface RespuestaKpis {
  sucursalId: number;
  periodo: string;
  totalVentas: number;
  cantidadTransacciones: number;
  ticketPromedio: number;
  metaMensual: number;
  porcentajeCumplimiento: number;
  productosBajoMinimo: number;
  rotacionPromedio: number;
  diasSinReposicion: number;
}

// ---- Productos (catálogo / inventario de ms-datos) ----
export type CategoriaProducto =
  | 'ELECTRODOMESTICO' | 'TV' | 'MOVIL' | 'CONSOLA'
  | 'COMPUTACION' | 'AUDIO' | 'ACCESORIO' | 'OTRO';

export const CATEGORIAS: { value: CategoriaProducto; label: string }[] = [
  { value: 'ELECTRODOMESTICO', label: 'Electrodoméstico' },
  { value: 'TV', label: 'TV' },
  { value: 'MOVIL', label: 'Móvil' },
  { value: 'CONSOLA', label: 'Consola' },
  { value: 'COMPUTACION', label: 'Computación' },
  { value: 'AUDIO', label: 'Audio' },
  { value: 'ACCESORIO', label: 'Accesorio' },
  { value: 'OTRO', label: 'Otro' },
];

// ProductoResponse del contrato de cable.
export interface ProductoDTO {
  id: number;
  codigo: string;
  nombre: string;
  sucursalId: number;
  sucursalCodigo: string;
  sucursalNombre: string;
  categoria: string;
  stock: number;
  stockMinimo: number;
  precio: number;
  descripcion: string | null;
  activo: boolean;
  fechaActualizacionStock: string;
  createdAt: string;
  updatedAt: string | null;
}

// ProductoRequest del contrato de cable (crear/actualizar/ítem de importación).
export interface ProductoCreatePayload {
  codigo: string;
  nombre: string;
  sucursalId: number;
  categoria: string;
  stock: number;
  stockMinimo: number;
  precio: number;
  descripcion: string | null;
}

export interface ImportResultado {
  total: number;
  insertados: number;
  rechazados: { codigo: string; sucursalId: number; motivo: string }[];
}

export interface LoginResponse {
  usuarioId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
}

export interface UsuarioCreatePayload {
  rut: string;
  dv: string;
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  telefono?: string;
}

export interface UsuarioUpdatePayload {
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  fechaNacimiento?: string | null;
}

export interface SucursalCreatePayload {
  codigo: string;
  nombre: string;
  ciudad: string;
  ciudadId?: number | null;
  latitud?: number | null;
  longitud?: number | null;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export class AuthError extends Error {}
