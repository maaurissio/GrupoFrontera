import { useState } from 'react';
import { Icon } from '../components/Icon';
import { Badge, Panel, ModalOverlay } from '../components/Primitives';
import { DATA } from '../data';

type Reporte = typeof DATA.reportesGuardados[0];

function estadoBadge(e: string) {
  if (e === 'Generado')   return <Badge kind="success">{e}</Badge>;
  if (e === 'En proceso') return <Badge kind="warning">{e}</Badge>;
  return <Badge kind="danger">{e}</Badge>;
}

function ScheduleReportModal({ onClose }: { onClose: () => void }) {
  const [nombre, setNombre] = useState('');
  const [suc, setSuc] = useState('all');
  const [formato, setFormato] = useState('PDF');
  const [freq, setFreq] = useState('Semanal');
  const valid = nombre.trim().length > 0;

  return (
    <ModalOverlay onClose={onClose}>
      <div className="card" style={{ width: 460, padding: 24, boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <h2 className="ds-h2" style={{ margin: 0 }}>Programar reporte</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><Icon name="x" size={16} /></button>
        </div>
        <p className="ds-sm" style={{ margin: '0 0 18px' }}>Se generará automáticamente según la frecuencia elegida</p>
        <div className="field" style={{ marginBottom: 14 }}>
          <label className="field-label">Nombre del reporte *</label>
          <input className="input" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Resumen semanal Santiago" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div className="field">
            <label className="field-label">Sucursal</label>
            <select className="input select" value={suc} onChange={e => setSuc(e.target.value)} style={{ height: 34 }}>
              <option value="all">Todas</option>
              {DATA.branches.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="field-label">Formato</label>
            <select className="input select" value={formato} onChange={e => setFormato(e.target.value)} style={{ height: 34 }}>
              <option value="PDF">PDF</option>
              <option value="Excel">Excel</option>
            </select>
          </div>
        </div>
        <div className="field" style={{ marginBottom: 18 }}>
          <label className="field-label">Frecuencia</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['Diario', 'Semanal', 'Mensual'].map(f => (
              <button key={f} onClick={() => setFreq(f)} style={{
                flex: 1, padding: '9px 12px', borderRadius: 8, cursor: 'pointer', textAlign: 'center',
                fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500,
                border: '1px solid ' + (freq === f ? 'var(--link-fg)' : 'var(--bg-border)'),
                background: freq === f ? 'var(--bg-surface-3)' : 'var(--bg-surface-1)', color: 'var(--text-primary)',
              }}>{f}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" disabled={!valid} onClick={onClose} style={{ opacity: valid ? 1 : 0.5, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="clock" size={16} />Programar
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

export function ReportesGuardadosView() {
  const [tab, setTab] = useState('all');
  const [reportes, setReportes] = useState<Reporte[]>(() => DATA.reportesGuardados.map(r => ({ ...r })));
  const [creating, setCreating] = useState(false);

  const toggleFav = (id: string) => setReportes(prev => prev.map(r => r.id === id ? { ...r, fav: !r.fav } : r));

  let rows = reportes;
  if (tab === 'fav')  rows = rows.filter(r => r.fav);
  if (tab === 'prog') rows = rows.filter(r => r.programado);

  const tabs = [
    { id: 'all',  label: 'Todos',       n: reportes.length },
    { id: 'fav',  label: 'Favoritos',   n: reportes.filter(r => r.fav).length },
    { id: 'prog', label: 'Programados', n: reportes.filter(r => r.programado).length },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        {[
          { label: 'Total reportes', value: reportes.length,                          icon: 'file-text',     accent: 'info' },
          { label: 'Favoritos',      value: reportes.filter(r => r.fav).length,       icon: 'star',          accent: 'warning' },
          { label: 'Programados',    value: reportes.filter(r => r.programado).length, icon: 'clock',         accent: 'orange' },
          { label: 'Con error',      value: reportes.filter(r => r.estado === 'Error').length, icon: 'alert-triangle', accent: 'danger' },
        ].map(k => (
          <div key={k.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px' }}>
            <span className="kpi-ico" style={{ width: 40, height: 40, color: 'var(--color-' + k.accent + ')' }}><Icon name={k.icon} size={20} /></span>
            <div>
              <div className="kpi-label">{k.label}</div>
              <div className="ds-kpi" style={{ fontSize: 26, marginTop: 2 }}>{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      <Panel style={{ padding: 0 }} bodyStyle={{ padding: 0 }} title="Reportes"
        action={
          <button className="btn btn-primary btn-sm" style={{ height: 32, display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => setCreating(true)}>
            <Icon name="plus" size={14} />Programar reporte
          </button>
        }>
        <div style={{ display: 'flex', gap: 6, padding: '12px 16px', borderBottom: '1px solid var(--bg-border)' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '6px 12px', borderRadius: 7,
              border: '1px solid ' + (tab === t.id ? 'var(--bg-border-strong)' : 'transparent'),
              background: tab === t.id ? 'var(--bg-surface-3)' : 'transparent',
              color: tab === t.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500,
            }}>
              {t.label}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-disabled)' }}>{t.n}</span>
            </button>
          ))}
        </div>
        <table className="tbl">
          <thead>
            <tr><th style={{ width: 36 }} /><th>Nombre</th><th>Período</th><th>Sucursal</th><th>Formato</th><th>Fecha</th><th>Estado</th><th /></tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td style={{ textAlign: 'center' }}>
                  <button onClick={() => toggleFav(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: r.fav ? '#f5c451' : 'var(--text-disabled)' }} title={r.fav ? 'Quitar favorito' : 'Marcar favorito'}>
                    <Icon name="star" size={14} />
                  </button>
                </td>
                <td>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{r.nombre}</div>
                  {r.programado && (
                    <div className="ds-label" style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Icon name="clock" size={10} />{r.frecuencia}
                    </div>
                  )}
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{r.periodo}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{r.sucursal}</td>
                <td>
                  <span className="badge" style={{
                    background: r.formato === 'PDF' ? 'var(--danger-bg)' : 'var(--success-bg)',
                    borderColor: r.formato === 'PDF' ? 'var(--danger-border)' : 'var(--success-border)',
                    color: r.formato === 'PDF' ? '#f87171' : '#4ade80',
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                  }}>
                    <Icon name={r.formato === 'PDF' ? 'file-text' : 'table'} size={10} />{r.formato}
                  </span>
                </td>
                <td className="ds-mono" style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{r.fecha}</td>
                <td>{estadoBadge(r.estado)}</td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: 4 }}>
                    {r.estado === 'Generado' && <button className="btn btn-ghost btn-sm" style={{ height: 28 }} title="Descargar"><Icon name="download" size={13} /></button>}
                    {r.estado === 'Error' && <button className="btn btn-ghost btn-sm" style={{ height: 28, color: 'var(--color-warning)' }} title="Regenerar"><Icon name="refresh-cw" size={13} /></button>}
                    <button className="btn btn-ghost btn-icon btn-sm" title="Eliminar" style={{ color: 'var(--text-secondary)' }}><Icon name="trash-2" size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div style={{ padding: '40px 16px', textAlign: 'center' }}>
            <Icon name="file-text" size={22} style={{ color: 'var(--text-disabled)' }} />
            <div className="ds-sm" style={{ marginTop: 8 }}>No hay reportes en esta categoría</div>
          </div>
        )}
      </Panel>

      {creating && <ScheduleReportModal onClose={() => setCreating(false)} />}
    </div>
  );
}
