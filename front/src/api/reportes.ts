import { apiFetchBlob } from './client';

export async function exportarReporte(
  sucursalId: number,
  periodo: string,
  formato: 'pdf' | 'xlsx',
  signal?: AbortSignal,
): Promise<void> {
  const path = `/api/bff/reportes/exportar?sucursalId=${sucursalId}&periodo=${encodeURIComponent(periodo)}&formato=${formato}`;
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
