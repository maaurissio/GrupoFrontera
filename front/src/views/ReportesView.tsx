import { useState } from 'react';
import { Icon } from '../components/Icon';
import { Badge, Delta, Panel } from '../components/Primitives';
import { LineChart } from '../components/Chart';
import { DATA } from '../data';

const PERIODOS = [
  { id: 'h1',  label: 'Ene – Jun 2026', months: ['Ene','Feb','Mar','Abr','May','Jun'] },
  { id: 'jun', label: 'Junio 2026',      months: ['Jun'] },
  { id: 'may', label: 'Mayo 2026',       months: ['May'] },
  { id: 'q2',  label: 'Abr – Jun 2026', months: ['Abr','May','Jun'] },
];

function metaKind(p: number) { return p >= 100 ? 'success' : p >= 70 ? 'warning' : 'danger'; }
function metaColor(p: number) { return 'var(--color-' + metaKind(p) + ')'; }

export function ReportesView() {
  const [exporting, setExporting] = useState<string | null>(null);
  const [sucFilter, setSucFilter] = useState('all');
  const [perFilter, setPerFilter] = useState('h1');

  function doExport(fmt: string) { setExporting(fmt); setTimeout(() => setExporting(null), 1600); }

  const filtered = sucFilter === 'all' ? DATA.branches : DATA.branches.filter(b => b.name === sucFilter);
  const totalSales = filtered.reduce((s, b) => s + parseInt(b.sales.replace(/\D/g, '')), 0);
  const totalTx = filtered.reduce((s, b) => s + b.tx, 0);
  const avgTicket = totalTx > 0 ? Math.round(totalSales / totalTx) : 0;
  const avgMeta = filtered.length > 0 ? Math.round(filtered.reduce((s, b) => s + b.meta, 0) / filtered.length) : 0;
  const fmt = (n: number) => '$' + n.toLocaleString('es-CL');

  const per = PERIODOS.find(p => p.id === perFilter) || PERIODOS[0];
  const chartMonths = per.months;
  const chartVentas = chartMonths.map(m => DATA.chart.ventas[DATA.chart.months.indexOf(m)] || 0);
  const chartTx = chartMonths.map(m => DATA.chart.tx[DATA.chart.months.indexOf(m)] || 0);
  const chartData = { months: chartMonths, ventas: chartVentas, tx: chartTx };

  const ranked = [...filtered].sort((a, b) => parseInt(b.sales.replace(/\D/g, '')) - parseInt(a.sales.replace(/\D/g, '')));

  const kpis = [
    { label: 'Total ventas', value: fmt(totalSales), delta: '+18,2%', dir: 'up' as const },
    { label: 'Ticket promedio', value: fmt(avgTicket), delta: '+2,1%', dir: 'up' as const },
    { label: 'Transacciones', value: totalTx.toLocaleString('es-CL'), delta: '+6,1%', dir: 'up' as const },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* filters */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', flexWrap: 'wrap' }}>
        <span className="ds-label" style={{ marginRight: 2 }}>Filtros</span>
        <div style={{ position: 'relative' }}>
          <select className="input select" value={sucFilter} onChange={e => setSucFilter(e.target.value)}
            style={{ height: 34, paddingLeft: 32, paddingRight: 14, minWidth: 200 }}>
            <option value="all">Todas las sucursales</option>
            {DATA.branches.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
          </select>
          <Icon name="map-pin" size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
        </div>
        <div style={{ position: 'relative' }}>
          <select className="input select" value={perFilter} onChange={e => setPerFilter(e.target.value)}
            style={{ height: 34, paddingLeft: 32, paddingRight: 14, minWidth: 170 }}>
            {PERIODOS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          <Icon name="calendar" size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
        </div>
        {sucFilter !== 'all' && (
          <button className="btn btn-ghost btn-sm" onClick={() => setSucFilter('all')} style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="x" size={12} />Limpiar filtro
          </button>
        )}
        <div style={{ flex: 1 }} />
        <button className="btn btn-secondary btn-sm" style={{ height: 34, display: 'flex', alignItems: 'center', gap: 6 }} disabled={!!exporting} onClick={() => doExport('pdf')}>
          {exporting === 'pdf' ? <><Icon name="loader" size={14} />Generando…</> : <><Icon name="file-text" size={14} />Exportar PDF</>}
        </button>
        <button className="btn btn-primary btn-sm" style={{ height: 34, display: 'flex', alignItems: 'center', gap: 6 }} disabled={!!exporting} onClick={() => doExport('excel')}>
          {exporting === 'excel' ? <><Icon name="loader" size={14} />Generando…</> : <><Icon name="table" size={14} />Exportar Excel</>}
        </button>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        {kpis.map(k => (
          <div key={k.label} className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span className="kpi-label">{k.label}</span>
            <div className="ds-kpi" style={{ fontSize: 28 }}>{k.value}</div>
            <Delta dir={k.dir}>{k.delta.replace(/[+\-−]/, '')}</Delta>
          </div>
        ))}
        <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span className="kpi-label">% Cumplimiento meta</span>
          <div className="ds-kpi" style={{ fontSize: 28, color: metaColor(avgMeta) }}>{avgMeta}%</div>
          <div style={{ height: 8, background: 'var(--bg-surface-1)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ width: Math.min(avgMeta, 100) + '%', height: '100%', background: metaColor(avgMeta), borderRadius: 999 }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.55fr) minmax(0,1fr)', gap: 16 }}>
        <Panel title={'Ventas — ' + (sucFilter === 'all' ? 'Grupo consolidado' : sucFilter)}>
          <LineChart data={chartData} height={220} />
        </Panel>
        <Panel title="Indicadores de inventario">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Productos bajo mínimo', value: '7',   icon: 'alert-triangle', kind: 'warning' },
              { label: 'Rotación promedio',     value: '6,2×', icon: 'refresh-cw',    kind: 'orange' },
              { label: 'Días sin reposición',   value: '12',  icon: 'clock',          kind: 'neutral' },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="kpi-ico" style={{ width: 36, height: 36, color: r.kind === 'neutral' ? 'var(--text-secondary)' : 'var(--color-' + r.kind + ')' }}>
                  <Icon name={r.icon} size={16} />
                </span>
                <span className="ds-sm" style={{ flex: 1, color: 'var(--text-secondary)' }}>{r.label}</span>
                <span className="ds-mono" style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 16 }}>{r.value}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel style={{ padding: 0 }} bodyStyle={{ padding: 0 }} title="Comparativo entre sucursales"
        action={<span className="ds-label">{per.label} · orden por ventas</span>}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Sucursal</th>
              <th style={{ textAlign: 'right' }}>Total ventas</th>
              <th style={{ textAlign: 'right' }}>Transacciones</th>
              <th style={{ textAlign: 'right' }}>Ticket prom.</th>
              <th style={{ textAlign: 'right' }}>% Meta</th>
              <th style={{ textAlign: 'right' }}>Variación</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((b, i) => (
              <tr key={b.name} style={{ cursor: 'pointer' }}>
                <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    {b.name}
                    {i === 0 && ranked.length > 1 && (
                      <span className="badge" style={{ background: '#3a2e05', border: '1px solid #a87b1e', color: '#f5c451', padding: '2px 7px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Icon name="star" size={10} />Top
                      </span>
                    )}
                  </span>
                </td>
                <td className="num">{b.sales}</td>
                <td className="num" style={{ color: 'var(--text-secondary)' }}>{b.tx}</td>
                <td className="num" style={{ color: 'var(--text-secondary)' }}>{b.ticket}</td>
                <td className="num"><Badge kind={metaKind(b.meta)}>{b.meta}%</Badge></td>
                <td className="num"><Delta dir={b.dir}>{b.delta.replace(/[+\-−]/, '')}</Delta></td>
              </tr>
            ))}
            {ranked.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)' }}>Sin datos para el filtro seleccionado</td></tr>
            )}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
