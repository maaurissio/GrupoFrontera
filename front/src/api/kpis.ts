import { apiFetch } from './client';
import { RespuestaKpis } from './types';

export function obtenerKpis(sucursalId: number, periodo: string, signal?: AbortSignal): Promise<RespuestaKpis> {
  return apiFetch<RespuestaKpis>(`/api/bff/kpis?sucursalId=${sucursalId}&periodo=${encodeURIComponent(periodo)}`, {}, signal);
}

export function obtenerComparativo(periodo: string, signal?: AbortSignal): Promise<RespuestaKpis[]> {
  return apiFetch<RespuestaKpis[]>(`/api/bff/kpis/comparativo?periodo=${encodeURIComponent(periodo)}`, {}, signal);
}
