import { apiFetch } from './client';
import type { RolDTO, RolCreatePayload } from './types';

export function listarRoles(signal?: AbortSignal): Promise<RolDTO[]> {
  return apiFetch<RolDTO[]>('/api/bff/roles', {}, signal);
}

export function crearRol(data: RolCreatePayload): Promise<RolDTO> {
  return apiFetch<RolDTO>('/api/bff/roles', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
