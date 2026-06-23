import { apiFetch } from './client';
import type { UsuarioDTO, UsuarioCreatePayload, UsuarioUpdatePayload, AsignacionSucursalDTO } from './types';

export function listarUsuarios(signal?: AbortSignal): Promise<UsuarioDTO[]> {
  // /todos incluye inactivos para poder reactivarlos; el filtro "Solo activos" es del lado del cliente.
  return apiFetch<UsuarioDTO[]>('/api/bff/usuarios/todos', {}, signal);
}

export function obtenerUsuario(id: string, signal?: AbortSignal): Promise<UsuarioDTO> {
  return apiFetch<UsuarioDTO>(`/api/bff/usuarios/${id}`, {}, signal);
}

export function crearUsuario(data: UsuarioCreatePayload): Promise<unknown> {
  return apiFetch('/api/bff/usuarios', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function actualizarUsuario(id: string, data: UsuarioUpdatePayload): Promise<UsuarioDTO> {
  return apiFetch<UsuarioDTO>(`/api/bff/usuarios/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function desactivarUsuario(id: string): Promise<void> {
  return apiFetch(`/api/bff/usuarios/${id}/desactivar`, { method: 'PUT' });
}

export function activarUsuario(id: string): Promise<void> {
  return apiFetch(`/api/bff/usuarios/${id}/activar`, { method: 'PUT' });
}

// --- Asignación de sucursales a un usuario ---

export function listarSucursalesUsuario(usuarioId: string, signal?: AbortSignal): Promise<AsignacionSucursalDTO[]> {
  return apiFetch<AsignacionSucursalDTO[]>(`/api/bff/usuarios/${usuarioId}/sucursales`, {}, signal);
}

export function asignarSucursal(usuarioId: string, sucursalId: number): Promise<unknown> {
  return apiFetch(`/api/bff/usuarios/${usuarioId}/sucursales`, {
    method: 'POST',
    body: JSON.stringify({ sucursalId }),
  });
}

export function desasignarSucursal(asignacionId: string): Promise<void> {
  return apiFetch(`/api/bff/usuarios/asignaciones-sucursal/${asignacionId}`, { method: 'DELETE' });
}
