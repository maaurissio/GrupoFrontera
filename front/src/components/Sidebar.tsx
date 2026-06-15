import { Icon } from './Icon';
import { DATA } from '../data';
import { useAuth } from '../context/AuthContext';
import type { ViewId } from '../data';

interface SidebarProps {
  active: ViewId;
  onNavigate: (v: ViewId) => void;
  onLogout: () => void;
}

export function Sidebar({ active, onNavigate, onLogout }: SidebarProps) {
  const { usuario } = useAuth();
  const displayName = usuario ? `${usuario.nombre} ${usuario.apellido}`.trim() : '—';
  const rol = (usuario?.roles ?? [])[0] ?? '';
  const initials = usuario ? ((usuario.nombre[0] ?? '') + (usuario.apellido[0] ?? '')).toUpperCase() : '—';

  return (
    <aside style={{
      width: 240, flex: 'none', background: 'var(--bg-surface-1)',
      borderRight: '1px solid var(--bg-border)', height: '100%',
      display: 'flex', flexDirection: 'column',
    }}>
      <div className="sidebar-brand" style={{ padding: '18px 18px 14px', borderBottom: '1px solid var(--bg-border)', height: 73, flex: 'none', overflow: 'hidden' }}>
        <img src="/assets/logo-cordillera.svg" width="184" height="37" alt="Grupo Cordillera" />
      </div>

      <nav style={{ padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflowY: 'auto' }}>
        <div className="ds-eyebrow" style={{ padding: '6px 10px 8px' }}>Monitoreo</div>
        {DATA.nav.map((item) => {
          const on = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as ViewId)}
              style={{
                display: 'flex', alignItems: 'center', gap: 11, padding: '9px 10px',
                borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left',
                background: on ? 'var(--bg-surface-3)' : 'transparent',
                color: on ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: on ? 500 : 400,
                transition: 'background 120ms, color 120ms',
              }}
              onMouseEnter={e => { if (!on) { (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface-2)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; } }}
              onMouseLeave={e => { if (!on) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; } }}
            >
              <Icon name={item.icon} size={18} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge ? (
                <span style={{
                  minWidth: 18, height: 18, padding: '0 5px', borderRadius: 999,
                  background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', color: '#fbbf24',
                  fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-mono)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>{item.badge}</span>
              ) : null}
            </button>
          );
        })}

        <div className="ds-eyebrow" style={{ padding: '18px 10px 8px' }}>Sistema</div>
        {(() => {
          const on = active === 'configuracion';
          return (
            <button onClick={() => onNavigate('configuracion')} style={{
              display: 'flex', alignItems: 'center', gap: 11, padding: '9px 10px',
              borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left',
              background: on ? 'var(--bg-surface-3)' : 'transparent',
              color: on ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: on ? 500 : 400,
            }}
              onMouseEnter={e => { if (!on) { (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface-2)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; } }}
              onMouseLeave={e => { if (!on) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; } }}
            >
              <Icon name="settings" size={18} /> Configuración
            </button>
          );
        })()}
      </nav>

      <div style={{ borderTop: '1px solid var(--bg-border)', padding: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 8px' }}>
          <span className="avatar" style={{ background: 'var(--bg-surface-3)', borderColor: 'var(--bg-border-strong)', color: 'var(--text-secondary)' }}>
            {initials}
          </span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="ds-sm" style={{ color: 'var(--text-primary)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</div>
            <div className="ds-label" style={{ fontSize: 11 }}>{rol}</div>
          </div>
          <button
            onClick={onLogout}
            title="Cerrar sesión"
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface-3)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
          >
            <Icon name="log-out" size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
