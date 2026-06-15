import { useState } from 'react';
import { Icon } from '../components/Icon';
import { Panel, Switch, ColorAvatar } from '../components/Primitives';
import { usePrefs } from '../context/PrefsContext';
import { useAuth } from '../context/AuthContext';

const CF_TABS = [
  { id: 'perfil',    label: 'Perfil',         icon: 'user' },
  { id: 'notif',     label: 'Notificaciones', icon: 'bell' },
  { id: 'interfaz',  label: 'Interfaz',       icon: 'panel-left' },
  { id: 'seguridad', label: 'Seguridad',      icon: 'shield' },
];

function TabPerfil() {
  const { usuario } = useAuth();
  const [nombre, setNombre] = useState(usuario?.nombre ?? '');
  const [apellido, setApellido] = useState(usuario?.apellido ?? '');
  const [email] = useState(usuario?.email ?? '');
  const [saved, setSaved] = useState(false);
  function save() { setSaved(true); setTimeout(() => setSaved(false), 1500); }
  const displayName = `${nombre} ${apellido}`.trim() || email;
  const initials = ((nombre[0] ?? '') + (apellido[0] ?? '')).toUpperCase() || 'U';
  const rol = (usuario?.roles ?? [])[0] ?? '';
  return (
    <div style={{ maxWidth: 520 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <ColorAvatar name={displayName} initials={initials} size={56} />
        <div>
          <div className="ds-h3" style={{ fontSize: 18 }}>{displayName}</div>
          <div className="ds-sm" style={{ color: 'var(--text-secondary)' }}>{rol}</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="field"><label className="field-label">Nombre</label><input className="input" value={nombre} onChange={e => setNombre(e.target.value)} /></div>
        <div className="field"><label className="field-label">Apellido</label><input className="input" value={apellido} onChange={e => setApellido(e.target.value)} /></div>
        <div className="field" style={{ gridColumn: '1 / -1' }}><label className="field-label">Email</label><input className="input" value={email} readOnly style={{ opacity: 0.7 }} /></div>
      </div>
      <div className="field" style={{ marginTop: 14 }}><label className="field-label">Cambiar contraseña</label><input className="input" type="password" placeholder="Nueva contraseña" /></div>
      <div className="field" style={{ marginTop: 14 }}><input className="input" type="password" placeholder="Confirmar contraseña" /></div>
      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <button className="btn btn-primary" onClick={save} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {saved ? <><Icon name="check" size={14} />Guardado</> : <><Icon name="check-circle-2" size={14} />Guardar cambios</>}
        </button>
      </div>
    </div>
  );
}

function TabNotif() {
  const [stock, setStock] = useState(true);
  const [servicio, setServicio] = useState(true);
  const [meta, setMeta] = useState(false);
  const [emailNotif, setEmailNotif] = useState(true);
  const [platNotif, setPlatNotif] = useState(true);
  const items = [
    { label: 'Stock bajo mínimo', desc: 'Recibir alerta cuando un SKU cae bajo el umbral configurado', on: stock, set: setStock },
    { label: 'Servicio caído o degradado', desc: 'Microservicios de la plataforma sin respuesta o con latencia', on: servicio, set: setServicio },
    { label: 'Meta mensual alcanzada', desc: 'Aviso cuando una sucursal cumple su meta del mes', on: meta, set: setMeta },
  ];
  return (
    <div style={{ maxWidth: 560 }}>
      <div className="ds-h3" style={{ marginBottom: 16 }}>Tipos de alerta</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map(it => (
          <div key={it.label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: 'var(--bg-surface-1)', border: '1px solid var(--bg-border)', borderRadius: 10 }}>
            <div style={{ flex: 1 }}>
              <div className="ds-sm" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{it.label}</div>
              <div className="ds-label" style={{ fontSize: 11 }}>{it.desc}</div>
            </div>
            <Switch on={it.on} onClick={() => it.set(!it.on)} />
          </div>
        ))}
      </div>
      <div className="ds-h3" style={{ margin: '24px 0 16px' }}>Canal de entrega</div>
      <div style={{ display: 'flex', gap: 12 }}>
        {[
          { label: 'En plataforma', on: platNotif, set: setPlatNotif },
          { label: 'Email',         on: emailNotif, set: setEmailNotif },
        ].map(c => (
          <div key={c.label} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg-surface-1)', border: '1px solid var(--bg-border)', borderRadius: 10 }}>
            <Icon name="activity" size={16} style={{ color: 'var(--text-secondary)' }} />
            <span className="ds-sm" style={{ flex: 1, color: 'var(--text-primary)', fontWeight: 500 }}>{c.label}</span>
            <Switch on={c.on} onClick={() => c.set(!c.on)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function TabInterfaz() {
  const { theme, density, setTheme, setDensity } = usePrefs();
  const [tz, setTz] = useState('America/Santiago');
  return (
    <div style={{ maxWidth: 460 }}>
      <div className="field" style={{ marginBottom: 18 }}>
        <label className="field-label">Tema</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {['dark', 'light'].map(t => {
            const on = theme === t;
            return (
              <button key={t} onClick={() => setTheme(t)} style={{
                flex: 1, padding: '10px 12px', borderRadius: 8, textAlign: 'center', cursor: 'pointer',
                fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500,
                border: '1px solid ' + (on ? 'var(--link-fg)' : 'var(--bg-border)'),
                background: on ? 'var(--bg-surface-3)' : 'var(--bg-surface-1)', color: 'var(--text-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                <Icon name={t === 'dark' ? 'moon' : 'sun'} size={14} />{t === 'dark' ? 'Oscuro' : 'Claro'}
              </button>
            );
          })}
        </div>
      </div>
      <div className="field" style={{ marginBottom: 18 }}>
        <label className="field-label">Densidad de datos</label>
        <p className="ds-label" style={{ margin: '0 0 8px', fontSize: 11 }}>Controla el espaciado de tablas y tarjetas en toda la plataforma.</p>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { id: 'compact', label: 'Compacta', desc: 'Más filas visibles' },
            { id: 'normal',  label: 'Normal',   desc: 'Balance ideal' },
            { id: 'wide',    label: 'Amplia',   desc: 'Más espacio' },
          ].map(d => {
            const on = density === d.id;
            return (
              <button key={d.id} onClick={() => setDensity(d.id)} style={{
                flex: 1, padding: '10px 12px', borderRadius: 8, textAlign: 'center', cursor: 'pointer',
                fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500,
                border: '1px solid ' + (on ? 'var(--link-fg)' : 'var(--bg-border)'),
                background: on ? 'var(--bg-surface-3)' : 'var(--bg-surface-1)', color: 'var(--text-primary)',
              }}>
                <div>{d.label}</div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 3 }}>{d.desc}</div>
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: 14, background: 'var(--bg-surface-1)', border: '1px solid var(--bg-border)', borderRadius: 8, overflow: 'hidden' }}>
          <table className="tbl" style={{ margin: 0 }}>
            <thead><tr><th>Vista previa</th><th>Densidad activa</th><th style={{ textAlign: 'right' }}>Valor</th></tr></thead>
            <tbody>
              <tr><td>Fila ejemplo</td><td><span className="badge">{density}</span></td><td className="num">$123.456</td></tr>
              <tr><td>Otra fila</td><td><span className="badge badge-success">OK</span></td><td className="num">$78.900</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="field">
        <label className="field-label">Zona horaria</label>
        <select className="input select" value={tz} onChange={e => setTz(e.target.value)} style={{ height: 34 }}>
          <option value="America/Santiago">America/Santiago (CLT, UTC−4)</option>
          <option value="America/Punta_Arenas">America/Punta_Arenas (UTC−3)</option>
          <option value="Pacific/Easter">Pacific/Easter (EAST, UTC−6)</option>
        </select>
      </div>
    </div>
  );
}

function TabSeguridad() {
  const { logout } = useAuth();
  const [twofa, setTwofa] = useState(false);
  const [minLen, setMinLen] = useState(8);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <div className="ds-h3" style={{ marginBottom: 16 }}>Autenticación en dos pasos (2FA)</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--bg-surface-1)', border: '1px solid var(--bg-border)', borderRadius: 10, marginBottom: 24 }}>
        <Icon name="shield" size={20} style={{ color: twofa ? 'var(--color-success)' : 'var(--text-disabled)' }} />
        <div style={{ flex: 1 }}>
          <div className="ds-sm" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Verificación en dos pasos</div>
          <div className="ds-label" style={{ fontSize: 11 }}>{twofa ? 'Activado — se requiere código al iniciar sesión' : 'Desactivado — solo contraseña'}</div>
        </div>
        <Switch on={twofa} onClick={() => setTwofa(!twofa)} />
      </div>
      <div className="ds-h3" style={{ marginBottom: 16 }}>Política de contraseñas</div>
      <div className="field" style={{ marginBottom: 24, maxWidth: 200 }}>
        <label className="field-label">Longitud mínima</label>
        <input className="input" type="number" min={6} max={32} value={minLen} onChange={e => setMinLen(parseInt(e.target.value) || 8)} style={{ width: 80 }} />
      </div>
      <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--bg-border)' }}>
        <button
          className="btn btn-danger"
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          onClick={handleLogout}
          disabled={loggingOut}
        >
          <Icon name="log-out" size={16} />
          {loggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
        </button>
      </div>
    </div>
  );
}

export function ConfiguracionView() {
  const [tab, setTab] = useState('perfil');
  const tabMap: Record<string, React.FC> = {
    perfil: TabPerfil, notif: TabNotif, interfaz: TabInterfaz, seguridad: TabSeguridad,
  };
  const View = tabMap[tab] || TabPerfil;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 20 }}>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {CF_TABS.map(t => {
          const on = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
              borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left',
              background: on ? 'var(--bg-surface-3)' : 'transparent',
              color: on ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: on ? 500 : 400,
            }}
              onMouseEnter={e => { if (!on) { (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface-2)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; } }}
              onMouseLeave={e => { if (!on) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; } }}
            >
              <Icon name={t.icon} size={16} />{t.label}
            </button>
          );
        })}
      </nav>
      <Panel title={CF_TABS.find(t => t.id === tab)?.label || ''}>
        <View />
      </Panel>
    </div>
  );
}
