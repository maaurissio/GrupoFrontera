import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiFetch, setTokenProvider, setRefreshHandler } from './client';
import { AuthError } from './types';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('apiFetch', () => {
  beforeEach(() => {
    setTokenProvider(() => null);
    setRefreshHandler(async () => null);
  });

  it('agrega el header Authorization cuando el tokenProvider devuelve un token', async () => {
    setTokenProvider(() => 'abc123');
    const mockFetch = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal('fetch', mockFetch);

    await apiFetch('/api/bff/test');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8090/api/bff/test',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer abc123' }),
      }),
    );
  });

  it('en un 401 invoca el refreshHandler y reintenta con el nuevo token; lanza AuthError si el refresh falla', async () => {
    setTokenProvider(() => 'expired-token');
    setRefreshHandler(vi.fn().mockResolvedValueOnce('new-token'));

    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(jsonResponse({ data: 1 }));
    vi.stubGlobal('fetch', mockFetch);

    const result = await apiFetch('/api/bff/test');
    expect(result).toEqual({ data: 1 });
    expect(mockFetch).toHaveBeenCalledTimes(2);

    setRefreshHandler(vi.fn().mockResolvedValue(null));
    mockFetch.mockResolvedValue(new Response(null, { status: 401 }));
    await expect(apiFetch('/api/bff/test')).rejects.toThrow(AuthError);
  });

  it('tolera respuestas 204 / 200 con cuerpo vacío devolviendo undefined', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    await expect(apiFetch('/api/bff/activar')).resolves.toBeUndefined();

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 200 })));
    await expect(apiFetch('/api/bff/desactivar')).resolves.toBeUndefined();
  });
});
