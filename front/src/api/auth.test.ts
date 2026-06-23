import { describe, it, expect, vi } from 'vitest';
import { loginApi } from './auth';

describe('loginApi', () => {
  it('lanza {status:401} en credenciales inválidas y resuelve con el LoginResponse en éxito', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 401 })));
    await expect(loginApi('a@cordillera.cl', 'incorrecta')).rejects.toEqual({ status: 401 });

    const loginResponse = {
      usuarioId: 'u1',
      email: 'a@cordillera.cl',
      accessToken: 'at',
      refreshToken: 'rt',
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(loginResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
    await expect(loginApi('a@cordillera.cl', 'correcta')).resolves.toEqual(loginResponse);
  });
});
