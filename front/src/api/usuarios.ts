import { apiFetch } from './client';
import { UsuarioDTO, UsuarioCreatePayload } from './types';

export function listarUsuarios(signal?: AbortSignal): Promise<UsuarioDTO[]> {
  return apiFetch<UsuarioDTO[]>('/api/bff/usuarios', {}, signal);
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

export function desactivarUsuario(id: string): Promise<void> {
  return apiFetch(`/api/bff/usuarios/${id}/desactivar`, { method: 'PUT' });
}

export function activarUsuario(id: string): Promise<void> {
  return apiFetch(`/api/bff/usuarios/${id}/activar`, { method: 'PUT' });
}
