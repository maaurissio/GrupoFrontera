import { useState } from 'react';
import { Icon } from './Icon';
import { ModalOverlay } from './Primitives';

export function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('c.rojas@cordillera.cl');
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 380 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <img src="/assets/logo-cordillera.svg" width="210" height="42" alt="Grupo Cordillera" />
        </div>
        <div className="card" style={{ padding: 28, boxShadow: 'var(--shadow-lg)' }}>
          <h1 className="ds-h2" style={{ margin: '0 0 4px', textAlign: 'center' }}>Plataforma Gerencial</h1>
          <p className="ds-sm" style={{ margin: '0 0 22px', textAlign: 'center' }}>Acceso interno · Grupo Cordillera</p>

          <div className="field" style={{ marginBottom: 14 }}>
            <label className="field-label">Correo corporativo</label>
            <div className="search-wrap">
              <Icon name="user" size={16} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-disabled)' }} />
              <input className="input input-search" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>

          <div className="field" style={{ marginBottom: 20 }}>
            <label className="field-label">Contraseña</label>
            <div className="search-wrap">
              <Icon name="lock" size={16} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-disabled)' }} />
              <input className="input input-search" type={show ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)} style={{ paddingRight: 36 }} />
              <button onClick={() => setShow(!show)} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={show ? 'eye-off' : 'eye'} size={15} />
              </button>
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: '100%', height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={onLogin}>
            Ingresar
            <Icon name="arrow-up-right" size={16} />
          </button>
          <p className="ds-label" style={{ textAlign: 'center', marginTop: 16, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <Icon name="shield" size={12} />
            Conexión cifrada · Solo personal autorizado
          </p>
        </div>
      </div>
    </div>
  );
}

export function ExportModal({ onClose }: { onClose: () => void }) {
  const [fmt, setFmt] = useState<'pdf' | 'xlsx'>('pdf');
  const fmts = [
    { id: 'pdf'  as const, label: 'PDF',   desc: 'Para directorio', icon: 'file-text' },
    { id: 'xlsx' as const, label: 'Excel', desc: 'Datos crudos',     icon: 'table' },
  ];
  return (
    <ModalOverlay onClose={onClose}>
      <div className="card" style={{ width: 420, padding: 24, boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <h2 className="ds-h2" style={{ margin: 0 }}>Exportar reporte</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><Icon name="x" size={16} /></button>
        </div>
        <p className="ds-sm" style={{ margin: '0 0 18px' }}>Resumen gerencial · Ene – Jun 2026</p>
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
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
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="download" size={16} />Descargar {fmt.toUpperCase()}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}
