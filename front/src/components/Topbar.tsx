import { useState } from 'react';
import { Icon } from './Icon';
import { Badge } from './Primitives';
import { DATA } from '../data';

function NotificationsDropdown({ onClose }: { onClose: () => void }) {
  const alerts = [
    ...DATA.inventario.filter(p => (p.pres + p.online) < p.min).map(p => ({
      type: 'stock', title: p.name,
      desc: p.branch + ' · stock ' + (p.pres + p.online) + ' de mín. ' + p.min,
      kind: (p.pres + p.online) === 0 ? 'danger' : 'warning', icon: 'package', ago: 'hace 15 min',
    })),
    { type: 'service', title: 'Motor de KPIs degradado', desc: 'Latencia elevada · 310 ms', kind: 'warning', icon: 'activity', ago: 'hace 42 min' },
    { type: 'service', title: 'Sincronización caída', desc: 'Sin conexión entre sedes', kind: 'danger', icon: 'wifi', ago: 'hace 2 horas' },
  ];
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60 }}>
      <div onClick={e => e.stopPropagation()} style={{
        position: 'absolute', top: 54, right: 140, width: 380,
        background: 'var(--bg-surface-2)', border: '1px solid var(--bg-border-strong)', borderRadius: 12,
        boxShadow: 'var(--shadow-pop)', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--bg-border)' }}>
          <span className="ds-h3">Notificaciones</span>
          <Badge kind="warning">{alerts.length} activas</Badge>
        </div>
        <div className="ds-scroll" style={{ maxHeight: 380, overflowY: 'auto' }}>
          {alerts.map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--bg-border)', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface-3)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              <span style={{
                width: 32, height: 32, borderRadius: 8, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: a.kind === 'danger' ? 'var(--danger-bg)' : 'var(--warning-bg)',
                border: '1px solid ' + (a.kind === 'danger' ? 'var(--danger-border)' : 'var(--warning-border)'),
                color: a.kind === 'danger' ? '#f87171' : '#fbbf24',
              }}>
                <Icon name={a.icon} size={14} />
              </span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="ds-sm" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{a.title}</div>
                <div className="ds-label" style={{ fontSize: 11 }}>{a.desc}</div>
              </div>
              <span className="ds-label" style={{ fontSize: 10, color: 'var(--text-disabled)', flex: 'none', whiteSpace: 'nowrap' }}>{a.ago}</span>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid var(--bg-border)', padding: '10px 16px', textAlign: 'center' }}>
          <button className="ds-label" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--link-fg)', fontSize: 12 }}>
            Marcar todas como leídas
          </button>
        </div>
      </div>
    </div>
  );
}

interface TopbarProps { title: string; alerts?: number; onExport: () => void; }
export function Topbar({ title, alerts = 0, onExport }: TopbarProps) {
  const [showNotif, setShowNotif] = useState(false);

  return (
    <header style={{
      height: 60, flex: 'none', borderBottom: '1px solid var(--bg-border)',
      background: 'var(--bg-base)', display: 'flex', alignItems: 'center',
      gap: 14, padding: '0 28px', position: 'sticky', top: 0, zIndex: 5,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, color: 'var(--text-secondary)' }}>
        <Icon name="layout-dashboard" size={16} />
        <span className="ds-sm" style={{ color: 'var(--text-secondary)' }}>Gerencial</span>
        <Icon name="chevron-right" size={14} style={{ color: 'var(--text-disabled)' }} />
        <span className="ds-sm" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{title}</span>
      </div>
      <div style={{ flex: 1 }} />
      <div className="search-wrap" style={{ width: 220 }}>
        <Icon name="search" size={16} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-disabled)' }} />
        <input className="input input-search" placeholder="Buscar sucursal, SKU…" style={{ width: '100%' }} />
      </div>
      <button title="Alertas" className="btn btn-secondary btn-icon" style={{ position: 'relative' }} onClick={() => setShowNotif(!showNotif)}>
        <Icon name="bell" size={16} />
        {alerts > 0 && (
          <span style={{
            position: 'absolute', top: -5, right: -5, minWidth: 16, height: 16, padding: '0 4px',
            borderRadius: 999, background: 'var(--color-danger)', color: '#fff',
            fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-mono)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg-base)',
          }}>{alerts}</span>
        )}
      </button>
      <button className="btn btn-primary" onClick={onExport} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon name="download" size={16} />Exportar
      </button>
      {showNotif && <NotificationsDropdown onClose={() => setShowNotif(false)} />}
    </header>
  );
}
