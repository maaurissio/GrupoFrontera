import { apiFetch } from './client';
import type { DatoConsolidadoDTO, LogTrazabilidadDTO } from './types';

export interface DatosFiltros {
  sucursalId?: number;
  tipoDato?: string;
  periodoDesde?: string;
  periodoHasta?: string;
  estado?: string;
}

function buildQuery(filtros: DatosFiltros): string {
  const params = new URLSearchParams();
  if (filtros.sucursalId != null) params.set('sucursalId', String(filtros.sucursalId));
  if (filtros.tipoDato) params.set('tipoDato', filtros.tipoDato);
  if (filtros.periodoDesde) params.set('periodoDesde', filtros.periodoDesde);
  if (filtros.periodoHasta) params.set('periodoHasta', filtros.periodoHasta);
  if (filtros.estado) params.set('estado', filtros.estado);
  const q = params.toString();
  return q ? `?${q}` : '';
}

export function listarDatos(filtros: DatosFiltros = {}, signal?: AbortSignal): Promise<DatoConsolidadoDTO[]> {
  return apiFetch<DatoConsolidadoDTO[]>(`/api/bff/datos${buildQuery(filtros)}`, {}, signal);
}

export function reprocesarDato(id: number): Promise<unknown> {
  return apiFetch(`/api/bff/datos/${id}/reprocesar`, { method: 'POST' });
}

export function logDato(id: number, signal?: AbortSignal): Promise<LogTrazabilidadDTO[]> {
  return apiFetch<LogTrazabilidadDTO[]>(`/api/bff/datos/${id}/log`, {}, signal);
}
