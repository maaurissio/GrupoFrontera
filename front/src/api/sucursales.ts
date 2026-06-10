import { apiFetch } from './client';
import { SucursalDTO, SucursalCreatePayload } from './types';

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
  return apiFetch<SucursalDTO>(`/api/bff/sucursales/${id}/estado`, {
    method: 'PUT',
    body: JSON.stringify({ habilitada }),
  });
}
