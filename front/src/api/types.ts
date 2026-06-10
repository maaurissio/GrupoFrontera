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
  habilitada: boolean;
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
  datoId: number;
  estado: string;
  mensaje: string;
  fechaRegistro: string;
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
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export class AuthError extends Error {}
