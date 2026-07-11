import type { LoginResponse } from './types';

// Ruta relativa — ver nota en client.ts sobre el proxy en dev/Docker.
const BFF_URL = '';

export async function loginApi(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${BFF_URL}/api/bff/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (res.status === 401) throw { status: 401 };
  if (!res.ok) throw { status: res.status };
  return res.json();
}

export async function logoutApi(refreshToken: string): Promise<void> {
  await fetch(`${BFF_URL}/api/bff/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
}

export async function refreshApi(refreshToken: string): Promise<{ accessToken: string; refreshToken: string } | null> {
  const res = await fetch(`${BFF_URL}/api/bff/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) return null;
  return res.json();
}
