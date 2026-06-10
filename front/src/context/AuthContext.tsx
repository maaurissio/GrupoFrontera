import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { loginApi, logoutApi, refreshApi } from '../api/auth';
import { obtenerUsuario } from '../api/usuarios';
import { setTokenProvider, setRefreshHandler } from '../api/client';

const RT_KEY = 'cord_rt';

interface UsuarioSesion {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  roles: string[];
}

interface AuthCtx {
  usuario: UsuarioSesion | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrateUsuario = useCallback(async (usuarioId: string, email: string) => {
    try {
      const dto = await obtenerUsuario(usuarioId);
      setUsuario({
        id: usuarioId,
        email,
        nombre: dto.nombre,
        apellido: dto.apellido,
        roles: dto.roles,
      });
    } catch {
      setUsuario({ id: usuarioId, email, nombre: email, apellido: '', roles: [] });
    }
  }, []);

  const doRefresh = useCallback(async (): Promise<string | null> => {
    const rt = localStorage.getItem(RT_KEY);
    if (!rt) return null;
    const result = await refreshApi(rt);
    if (!result) {
      localStorage.removeItem(RT_KEY);
      setAccessToken(null);
      setUsuario(null);
      return null;
    }
    localStorage.setItem(RT_KEY, result.refreshToken);
    setAccessToken(result.accessToken);
    return result.accessToken;
  }, []);

  useEffect(() => {
    setTokenProvider(() => accessToken);
  }, [accessToken]);

  useEffect(() => {
    setRefreshHandler(doRefresh);
  }, [doRefresh]);

  useEffect(() => {
    const rt = localStorage.getItem(RT_KEY);
    if (!rt) { setLoading(false); return; }
    doRefresh().then(async (token) => {
      if (token) {
        const rt2 = localStorage.getItem(RT_KEY);
        if (rt2) {
          const payload = parseJwtPayload(token);
          if (payload?.sub && payload?.email) {
            await hydrateUsuario(payload.sub, payload.email);
          }
        }
      }
      setLoading(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (email: string, password: string) => {
    const resp = await loginApi(email, password);
    setAccessToken(resp.accessToken);
    localStorage.setItem(RT_KEY, resp.refreshToken);
    await hydrateUsuario(resp.usuarioId, resp.email);
  }, [hydrateUsuario]);

  const logout = useCallback(async () => {
    const rt = localStorage.getItem(RT_KEY);
    if (rt) {
      try { await logoutApi(rt); } catch { /* ignore */ }
    }
    localStorage.removeItem(RT_KEY);
    setAccessToken(null);
    setUsuario(null);
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}

function parseJwtPayload(token: string): Record<string, string> | null {
  try {
    const [, payload] = token.split('.');
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}
