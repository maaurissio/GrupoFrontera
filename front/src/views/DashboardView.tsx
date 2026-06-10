import { useState } from 'react';
import { Icon } from '../components/Icon';
import { Badge, Delta, Panel, ColorAvatar } from '../components/Primitives';
import { LineChart } from '../components/Chart';
import { DATA } from '../data';
import type { ViewId } from '../data';

const KPI_ACCENT: Record<string, string> = {
  info: 'var(--color-info)', warning: 'var(--color-warning)',
  success: 'var(--color-success)', danger: 'var(--color-danger)', neutral: 'var(--text-primary)',
};

function KpiCardCA({ kpi }: { kpi: typeof DATA.kpis[0] }) {
  const [tip, setTip] = useState(false);
  return (
    <div
      className="card card-hover"
      style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14, position: 'relative' }}
      onMouseEnter={() => setTip(true)}
      onMouseLeave={() => setTip(false)}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="kpi-label">{kpi.label}</span>
        <span className="kpi-ico" style={{ color: KPI_ACCENT[kpi.accent] }}>
          <Icon name={kpi.icon} size={16} />
        </span>
      </div>
      <div className="kpi-value" style={{ color: kpi.accent === 'warning' ? 'var(--color-warning)' : 'var(--text-white)' }}>{kpi.value}</div>
      <div className="kpi-foot">
        {'delta' in kpi && kpi.delta && <Delta dir={kpi.dir}>{(kpi.delta as string).replace(/[+\-−]/, '')}</Delta>}
        {'badge' in kpi && kpi.badge && <Badge kind={kpi.badge.kind}>{kpi.badge.text}</Badge>}
        {'sub' in kpi && kpi.sub && <span>{kpi.sub}</span>}
      </div>
      {tip && kpi.desc && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 8px)', left: 16, right: 16, zIndex: 10,
          background: 'var(--bg-surface-3)', border: '1px solid var(--bg-border-strong)', borderRadius: 8,
          padding: '8px 10px', boxShadow: 'var(--shadow-pop)',
        }}>
          <div className="ds-sm" style={{ fontSize: 12, color: 'var(--text-primary)' }}>{kpi.desc}</div>
        </div>
      )}
    </div>
  );
}

export function DashboardView({ onNavigate }: { onNavigate?: (v: ViewId) => void }) {
  const [q, setQ] = useState('');
  const filtered = DATA.ventasRecientes.filter(v =>
    v.sucursal.toLowerCase().includes(q.toLowerCase()) || v.vendedor.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPI row */}
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {DATA.kpis.map(k => <KpiCardCA key={k.id} kpi={k} />)}
        </div>
        <div className="ds-label" style={{ fontSize: 11, marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-disabled)' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-success)' }} />
          Actualización automática cada 60 s · última: hace 12 s
        </div>
      </div>

      {/* chart + modules */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.55fr) minmax(0,1fr)', gap: 16 }}>
        <Panel title="Ventas en el tiempo" action={
          <button className="btn btn-secondary btn-sm" style={{ height: 30, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="calendar" size={13} />Ene – Jun 2026<Icon name="chevron-down" size={13} style={{ color: 'var(--text-secondary)' }} />
          </button>
        }>
          <LineChart data={DATA.chart} height={220} />
        </Panel>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignContent: 'start' }}>
          {DATA.modules.map(m => (
            <button key={m.id} onClick={() => onNavigate?.(m.route as ViewId)} className="card card-hover"
              style={{ padding: 16, textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 10, border: '1px solid var(--bg-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="kpi-ico" style={{ color: 'var(--text-secondary)' }}><Icon name={m.icon} size={16} /></span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-' + m.kind + ')' }} />
                  <span className="ds-label" style={{ fontSize: 9, letterSpacing: '0.06em', color: 'var(--color-' + m.kind + ')' }}>{m.status}</span>
                </span>
              </div>
              <div>
                <div className="ds-sm" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{m.title}</div>
                <div className="ds-label" style={{ fontSize: 11, marginTop: 2 }}>{m.desc}</div>
              </div>
              <span className="ds-label" style={{ fontSize: 11, color: 'var(--link-fg)', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 'auto' }}>
                Ver módulo <Icon name="arrow-right" size={12} />
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ventas recientes */}
      <Panel style={{ padding: 0 }} bodyStyle={{ padding: 0 }} title="Ventas recientes" action={
        <div className="search-wrap" style={{ width: 220 }}>
          <Icon name="search" size={15} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-disabled)', pointerEvents: 'none' }} />
          <input className="input input-search" placeholder="Buscar sucursal o vendedor…" value={q} onChange={e => setQ(e.target.value)} style={{ height: 32 }} />
        </div>
      }>
        <table className="tbl">
          <thead>
            <tr><th>Sucursal</th><th>Vendedor</th><th style={{ textAlign: 'right' }}>Monto</th><th style={{ textAlign: 'right' }}>Fecha</th></tr>
          </thead>
          <tbody>
            {filtered.map(v => (
              <tr key={v.id}>
                <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{v.sucursal}</td>
                <td>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
                    <ColorAvatar name={v.vendedor} initials={v.vendedor.split(' ').map(p => p[0]).slice(0, 2).join('')} size={28} />
                    <span style={{ color: 'var(--text-primary)' }}>{v.vendedor}</span>
                  </span>
                </td>
                <td className="num">{v.monto}</td>
                <td className="num" style={{ color: 'var(--text-secondary)' }} title={v.full}>{v.ago}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: '32px 16px', textAlign: 'center' }}>
            <Icon name="search" size={20} style={{ color: 'var(--text-disabled)' }} />
            <div className="ds-sm" style={{ marginTop: 8 }}>Sin resultados para tu búsqueda</div>
          </div>
        )}
        <div style={{ borderTop: '1px solid var(--bg-border)', padding: '12px 16px', textAlign: 'center' }}>
          <button onClick={() => onNavigate?.('reportes')} className="ds-label"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--link-fg)', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            Ver todas las ventas <Icon name="arrow-right" size={12} />
          </button>
        </div>
      </Panel>
    </div>
  );
}
