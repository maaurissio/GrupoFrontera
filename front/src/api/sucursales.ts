import { apiFetch } from './client';
import type { SucursalDTO, SucursalCreatePayload, AsignacionSucursalDTO } from './types';

export function listarSucursales(signal?: AbortSignal): Promise<SucursalDTO[]> {
  return apiFetch<SucursalDTO[]>('/api/bff/sucursales', {}, signal);
}

export function obtenerSucursal(id: number): Promise<SucursalDTO> {
  return apiFetch<SucursalDTO>(`/api/bff/sucursales/${id}`);
}

export function crearSucursal(data: SucursalCreatePayload): Promise<SucursalDTO> {
  return apiFetch<SucursalDTO>('/api/bff/sucursales', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function actualizarSucursal(id: number, data: SucursalCreatePayload): Promise<SucursalDTO> {
  return apiFetch<SucursalDTO>(`/api/bff/sucursales/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function cambiarEstadoSucursal(id: number, habilitada: boolean): Promise<SucursalDTO> {
  // El backend (BFF y ms-datos) espera el campo "activo", no "habilitada".
  return apiFetch<SucursalDTO>(`/api/bff/sucursales/${id}/estado`, {
    method: 'PUT',
    body: JSON.stringify({ activo: habilitada }),
  });
}

// Direccion inversa de listarSucursalesUsuario (api/usuarios.ts): usuarios asignados a esta sucursal.
export function listarUsuariosSucursal(sucursalId: number, signal?: AbortSignal): Promise<AsignacionSucursalDTO[]> {
  return apiFetch<AsignacionSucursalDTO[]>(`/api/bff/sucursales/${sucursalId}/usuarios`, {}, signal);
}
