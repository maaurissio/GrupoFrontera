import { useState, useEffect, type FormEvent } from 'react';
import { Icon } from './Icon';
import { ModalOverlay } from './Primitives';
import { useAuth } from '../context/AuthContext';
import { listarSucursales } from '../api/sucursales';
import { exportarReporte } from '../api/reportes';
import type { SucursalDTO } from '../api/types';

export function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValid = email.includes('@') && email.includes('.');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!emailValid || !pw) {
      setError('Ingresa un correo válido y una contraseña.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await login(email, pw);
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status === 401) {
        setError('Correo o contraseña incorrectos.');
      } else {
        setError('Ha ocurrido un error inesperado. Intente más tarde.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 380 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <img src="/assets/logo-cordillera.svg" width="210" height="42" alt="Grupo Cordillera" />
        </div>
        <div className="card" style={{ padding: 28, boxShadow: 'var(--shadow-lg)' }}>
          <h1 className="ds-h2" style={{ margin: '0 0 4px', textAlign: 'center' }}>Plataforma Gerencial</h1>
          <p className="ds-sm" style={{ margin: '0 0 22px', textAlign: 'center' }}>Acceso interno · Grupo Cordillera</p>

          {error && (
            <div role="alert" style={{ background: 'var(--color-danger-bg, rgba(239,68,68,.12))', border: '1px solid var(--color-danger)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: 'var(--color-danger, #ef4444)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="alert-circle" size={15} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="field" style={{ marginBottom: 14 }}>
              <label className="field-label" htmlFor="login-email">Correo corporativo</label>
              <div className="search-wrap">
                <Icon name="user" size={16} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-disabled)' }} />
                <input
                  id="login-email"
                  className="input input-search"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="field" style={{ marginBottom: 20 }}>
              <label className="field-label" htmlFor="login-pw">Contraseña</label>
              <div className="search-wrap">
                <Icon name="lock" size={16} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-disabled)' }} />
                <input
                  id="login-pw"
                  className="input input-search"
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={pw}
                  onChange={e => setPw(e.target.value)}
                  style={{ paddingRight: 36 }}
                  disabled={loading}
                />
                <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={show ? 'eye-off' : 'eye'} size={15} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              disabled={loading}
            >
              {loading ? <><Icon name="loader" size={16} />Ingresando…</> : <><Icon name="arrow-up-right" size={16} />Ingresar</>}
            </button>
          </form>

          <p className="ds-label" style={{ textAlign: 'center', marginTop: 16, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <Icon name="shield" size={12} />
            Conexión cifrada · Solo personal autorizado
          </p>
        </div>
      </div>
    </div>
  );
}

function currentPeriodo(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function ExportModal({ onClose }: { onClose: () => void }) {
  const [fmt, setFmt] = useState<'pdf' | 'xlsx'>('pdf');
  const [sucursales, setSucursales] = useState<SucursalDTO[]>([]);
  const [sucursalId, setSucursalId] = useState<number | 'all'>('all');
  const [periodo, setPeriodo] = useState(currentPeriodo());
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    listarSucursales(ac.signal)
      .then(s => setSucursales(s))
      .catch(() => {});
    return () => ac.abort();
  }, []);

  const fmts = [
    { id: 'pdf'  as const, label: 'PDF',   desc: 'Para directorio', icon: 'file-text' },
    { id: 'xlsx' as const, label: 'Excel', desc: 'Datos crudos',     icon: 'table' },
  ];

  async function handleDownload() {
    setDownloading(true);
    setError(null);
    try {
      await exportarReporte(sucursalId === 'all' ? null : sucursalId, periodo, fmt);
      onClose();
    } catch (err) {
      const status = (err as { status?: number }).status;
      const alcance = sucursalId === 'all' ? 'ninguna sucursal' : 'esta sucursal';
      setError(
        status === 404
          ? `No hay KPIs para ${alcance} en ${periodo}. Elige otro período.`
          : 'No se pudo generar el reporte. Intenta nuevamente.',
      );
    } finally {
      setDownloading(false);
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="card" style={{ width: 420, padding: 24, boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <h2 className="ds-h2" style={{ margin: 0 }}>Exportar reporte</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><Icon name="x" size={16} /></button>
        </div>
        <p className="ds-sm" style={{ margin: '0 0 18px' }}>Reporte de KPIs por sucursal y período</p>

        <div className="field" style={{ marginBottom: 14 }}>
          <label className="field-label">Sucursal</label>
          <select className="input select" value={sucursalId}
            onChange={e => setSucursalId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            style={{ height: 36, width: '100%' }}>
            <option value="all">Todas las sucursales (consolidado)</option>
            {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </div>

        <div className="field" style={{ marginBottom: 18 }}>
          <label className="field-label">Período</label>
          <input className="input" type="month" value={periodo}
            onChange={e => setPeriodo(e.target.value)} style={{ height: 36, width: '100%' }} />
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
          {fmts.map(f => (
            <button key={f.id} onClick={() => setFmt(f.id)} style={{
              flex: 1, textAlign: 'left', padding: 14, borderRadius: 10, cursor: 'pointer',
              background: fmt === f.id ? 'var(--bg-surface-3)' : 'var(--bg-surface-1)',
              border: '1px solid ' + (fmt === f.id ? 'var(--color-info)' : 'var(--bg-border)'),
            }}>
              <Icon name={f.icon} size={20} style={{ color: fmt === f.id ? 'var(--color-info)' : 'var(--text-secondary)' }} />
              <div className="ds-sm" style={{ color: 'var(--text-primary)', fontWeight: 600, marginTop: 8 }}>{f.label}</div>
              <div className="ds-label" style={{ fontSize: 11 }}>{f.desc}</div>
            </button>
          ))}
        </div>

        {error && (
          <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-danger)', color: 'var(--color-danger)', fontSize: 13 }}>
            <Icon name="alert-circle" size={15} />{error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={downloading}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleDownload} disabled={downloading} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {downloading ? <><Icon name="loader" size={16} />Generando…</> : <><Icon name="download" size={16} />Descargar {fmt.toUpperCase()}</>}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}
