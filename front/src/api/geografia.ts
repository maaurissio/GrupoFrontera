import { apiFetch } from './client';
import type { RegionDTO, CiudadDTO } from './types';

export function listarRegiones(signal?: AbortSignal): Promise<RegionDTO[]> {
  return apiFetch<RegionDTO[]>('/api/bff/regiones', {}, signal);
}

export function listarCiudades(regionId?: number, signal?: AbortSignal): Promise<CiudadDTO[]> {
  const qs = regionId != null ? `?regionId=${regionId}` : '';
  return apiFetch<CiudadDTO[]>(`/api/bff/ciudades${qs}`, {}, signal);
}
