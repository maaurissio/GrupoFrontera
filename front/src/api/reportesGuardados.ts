import { apiFetch } from './client';
import type { ReporteGeneradoDTO } from './types';

export function listarReportesGuardados(signal?: AbortSignal): Promise<ReporteGeneradoDTO[]> {
  return apiFetch<ReporteGeneradoDTO[]>('/api/bff/reportes-guardados', {}, signal);
}

export function eliminarReporteGuardado(id: number): Promise<void> {
  return apiFetch(`/api/bff/reportes-guardados/${id}`, { method: 'DELETE' });
}

export function marcarFavoritoReporte(id: number, favorito: boolean): Promise<ReporteGeneradoDTO> {
  return apiFetch<ReporteGeneradoDTO>(`/api/bff/reportes-guardados/${id}/favorito`, {
    method: 'PUT',
    body: JSON.stringify({ favorito }),
  });
}
