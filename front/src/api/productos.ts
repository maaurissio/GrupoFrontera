import { apiFetch } from './client';
import type { ProductoDTO, ProductoCreatePayload, ImportResultado } from './types';

export interface ProductosFiltros {
  sucursalId?: number;
  categoria?: string;
  q?: string;
  activo?: boolean;
}

function buildQuery(filtros: ProductosFiltros): string {
  const params = new URLSearchParams();
  if (filtros.sucursalId != null) params.set('sucursalId', String(filtros.sucursalId));
  if (filtros.categoria) params.set('categoria', filtros.categoria);
  if (filtros.q) params.set('q', filtros.q);
  if (filtros.activo != null) params.set('activo', String(filtros.activo));
  const q = params.toString();
  return q ? `?${q}` : '';
}

export function listarProductos(filtros: ProductosFiltros = {}, signal?: AbortSignal): Promise<ProductoDTO[]> {
  return apiFetch<ProductoDTO[]>(`/api/bff/productos${buildQuery(filtros)}`, {}, signal);
}

export function crearProducto(data: ProductoCreatePayload): Promise<ProductoDTO> {
  return apiFetch<ProductoDTO>('/api/bff/productos', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function actualizarProducto(id: number, data: ProductoCreatePayload): Promise<ProductoDTO> {
  return apiFetch<ProductoDTO>(`/api/bff/productos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function cambiarEstadoProducto(id: number, activo: boolean): Promise<ProductoDTO> {
  return apiFetch<ProductoDTO>(`/api/bff/productos/${id}/estado`, {
    method: 'PUT',
    body: JSON.stringify({ activo }),
  });
}

export function importarProductos(items: ProductoCreatePayload[]): Promise<ImportResultado> {
  return apiFetch<ImportResultado>('/api/bff/productos/importar', {
    method: 'POST',
    body: JSON.stringify(items),
  });
}
