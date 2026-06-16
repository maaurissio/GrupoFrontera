import { apiFetchBlob } from './client';

export async function exportarReporte(
  sucursalId: number | null,
  periodo: string,
  formato: 'pdf' | 'xlsx',
  signal?: AbortSignal,
): Promise<void> {
  const params = new URLSearchParams({ periodo, formato });
  if (sucursalId != null) params.set('sucursalId', String(sucursalId));
  const path = `/api/bff/reportes/exportar?${params.toString()}`;
  const { blob, filename } = await apiFetchBlob(path, signal);

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
