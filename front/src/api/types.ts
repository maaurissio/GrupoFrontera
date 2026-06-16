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

export interface DatoConsolidadoDTO {
  id: number;
  fuenteId: number;
  fuenteCodigo: string;
  fuenteNombre: string;
  sucursalId: number;
  sucursalCodigo: string;
  sucursalNombre: string;
  tipoDato: string;
  periodo: string;
  valor: string;
  estado: 'RECIBIDO' | 'VALIDADO' | 'PROCESADO' | 'ERROR';
  createdAt: string;
  updatedAt: string;
}

export interface LogTrazabilidadDTO {
  id: number;
  accion: string;
  detalle: string;
  createdAt: string;
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
