import { ApiError, AuthError } from './types';

// Rutas relativas: en dev, Vite las proxea a localhost:8090 (ver vite.config.ts);
// en Docker, nginx las proxea al servicio `bff` (ver nginx.conf). Así funciona
// igual sin importar desde qué host/IP se acceda al front.
const BFF_URL = '';

type TokenProvider = () => string | null;
type RefreshHandler = () => Promise<string | null>;

let tokenProvider: TokenProvider = () => null;
let refreshHandler: RefreshHandler = async () => null;

export function setTokenProvider(fn: TokenProvider) {
  tokenProvider = fn;
}

export function setRefreshHandler(fn: RefreshHandler) {
  refreshHandler = fn;
}

async function doFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = tokenProvider();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  return fetch(`${BFF_URL}${path}`, { ...init, headers });
}

export async function apiFetch<T = unknown>(
  path: string,
  init: RequestInit = {},
  signal?: AbortSignal,
): Promise<T> {
  const res = await doFetch(path, { ...init, signal });

  if (res.status === 401) {
    const newToken = await refreshHandler();
    if (!newToken) throw new AuthError('Sesión expirada');

    const retryHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${newToken}`,
    };
    const retry = await fetch(`${BFF_URL}${path}`, { ...init, signal, headers: retryHeaders });
    if (!retry.ok) throw new AuthError('Sesión expirada');
    return parseBody<T>(retry);
  }

  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try { const body = await res.json(); msg = body.message || body.title || msg; } catch { /* ignore */ }
    throw new ApiError(res.status, msg);
  }

  return parseBody<T>(res);
}

// Tolera respuestas sin cuerpo (204, o 200 con body vacío como activar/desactivar):
// devolver res.json() sobre un cuerpo vacío lanza SyntaxError.
async function parseBody<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export async function apiFetchBlob(
  path: string,
  signal?: AbortSignal,
): Promise<{ blob: Blob; filename: string }> {
  const res = await doFetch(path, { signal });
  if (!res.ok) throw new ApiError(res.status, `Error ${res.status}`);

  const disposition = res.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename[^;=\n]*=["']?([^"'\n;]+)/i);
  const filename = match ? match[1].trim() : 'reporte.pdf';

  return { blob: await res.blob(), filename };
}
