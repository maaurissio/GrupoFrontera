import { Icon } from './Icon';

interface TopbarProps { title: string; onExport: () => void; }
export function Topbar({ title, onExport }: TopbarProps) {
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
      <button className="btn btn-primary" onClick={onExport} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon name="download" size={16} />Exportar
      </button>
    </header>
  );
}
