import { apiFetch } from './client';
import type { KpisUpdatePayload, RespuestaKpis, VentaDetalleDTO, VentaPaginaDTO } from './types';

export function obtenerKpis(sucursalId: number, periodo: string, signal?: AbortSignal): Promise<RespuestaKpis> {
  return apiFetch<RespuestaKpis>(`/api/bff/kpis?sucursalId=${sucursalId}&periodo=${encodeURIComponent(periodo)}`, {}, signal);
}

export function obtenerComparativo(periodo: string, signal?: AbortSignal): Promise<RespuestaKpis[]> {
  return apiFetch<RespuestaKpis[]>(`/api/bff/kpis/comparativo?periodo=${encodeURIComponent(periodo)}`, {}, signal);
}

export function actualizarKpis(payload: KpisUpdatePayload, signal?: AbortSignal): Promise<RespuestaKpis> {
  return apiFetch<RespuestaKpis>('/api/bff/kpis', { method: 'PUT', body: JSON.stringify(payload) }, signal);
}

export function listarVentas(
  params: { sucursalId?: number; periodoDesde: string; periodoHasta: string; page?: number; size?: number },
  signal?: AbortSignal,
): Promise<VentaPaginaDTO> {
  const qs = new URLSearchParams();
  if (params.sucursalId != null) qs.set('sucursalId', String(params.sucursalId));
  qs.set('periodoDesde', params.periodoDesde);
  qs.set('periodoHasta', params.periodoHasta);
  qs.set('page', String(params.page ?? 0));
  qs.set('size', String(params.size ?? 15));
  return apiFetch<VentaPaginaDTO>(`/api/bff/kpis/ventas?${qs.toString()}`, {}, signal);
}

export function obtenerVentaDetalle(id: number, signal?: AbortSignal): Promise<VentaDetalleDTO> {
  return apiFetch<VentaDetalleDTO>(`/api/bff/kpis/ventas/${id}`, {}, signal);
}
