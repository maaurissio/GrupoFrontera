import { useState, useEffect, useCallback } from 'react';
import { Icon } from '../components/Icon';
import { Badge, Delta, Panel } from '../components/Primitives';
import { LineChart } from '../components/Chart';
import { DATA } from '../data';
import type { ViewId } from '../data';
import { listarSucursales } from '../api/sucursales';
import { obtenerKpis } from '../api/kpis';
import { ApiError } from '../api/types';
import type { SucursalDTO, RespuestaKpis } from '../api/types';

function currentPeriodo(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function fmtClp(n: number): string {
  return '$' + Math.round(n).toLocaleString('es-CL');
}

function metaKind(p: number) { return p > 90 ? 'success' : p >= 60 ? 'warning' : 'danger'; }
function metaColor(p: number) { return 'var(--color-' + metaKind(p) + ')'; }

const KPI_ACCENT: Record<string, string> = {
  info: 'var(--color-info)', warning: 'var(--color-warning)',
  success: 'var(--color-success)', danger: 'var(--color-danger)', neutral: 'var(--text-primary)',
};

interface KpiCard {
  id: string; label: string; value: string; icon: string; accent: string;
  delta?: string; dir?: 'up' | 'down'; sub?: string;
  badge?: { text: string; kind: 'warning' | 'danger' | 'success' | 'neutral' };
  desc: string;
}

function kpisFromResponse(kpi: RespuestaKpis): KpiCard[] {
  const pct = Number(kpi.porcentajeCumplimiento);
  return [
    {
      id: 'ventas', label: 'Ventas del mes', value: fmtClp(Number(kpi.totalVentas)),
      icon: 'dollar-sign', accent: 'info', sub: `Meta: ${fmtClp(Number(kpi.metaMensual))}`,
      desc: 'Monto total facturado en el mes en curso.',
    },
    {
      id: 'tx', label: 'Transacciones', value: kpi.cantidadTransacciones.toLocaleString('es-CL'),
      icon: 'shopping-cart', accent: 'neutral',
      desc: 'Cantidad de ventas registradas en el período.',
    },
    {
      id: 'minimo', label: 'Bajo mínimo', value: String(kpi.productosBajoMinimo),
      icon: 'alert-triangle', accent: kpi.productosBajoMinimo > 0 ? 'warning' : 'success',
      badge: kpi.productosBajoMinimo > 0 ? { text: 'Requiere atención', kind: 'warning' } : undefined,
      desc: 'SKU con stock por debajo del mínimo configurado.',
    },
    {
      id: 'meta', label: '% Cumplimiento meta', value: `${pct.toFixed(1)}%`,
      icon: 'target', accent: metaKind(pct),
      badge: pct < 60 ? { text: 'Por debajo de meta', kind: 'danger' }
           : pct < 90 ? { text: 'En progreso', kind: 'warning' }
           : { text: 'Meta alcanzada', kind: 'success' },
      desc: 'Porcentaje de la meta mensual de ventas alcanzada.',
    },
  ];
}

function KpiCardCA({ kpi }: { kpi: KpiCard }) {
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
        <span className="kpi-ico" style={{ color: KPI_ACCENT[kpi.accent] || 'var(--text-primary)' }}>
          <Icon name={kpi.icon} size={16} />
        </span>
      </div>
      <div className="kpi-value" style={{ color: kpi.accent === 'warning' || kpi.accent === 'danger' ? metaColor(kpi.accent === 'danger' ? 0 : 75) : 'var(--text-white)' }}>
        {kpi.value}
      </div>
      <div className="kpi-foot">
        {kpi.delta && kpi.dir && <Delta dir={kpi.dir}>{kpi.delta.replace(/[+\-−]/, '')}</Delta>}
        {kpi.badge && <Badge kind={kpi.badge.kind}>{kpi.badge.text}</Badge>}
        {kpi.sub && <span>{kpi.sub}</span>}
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

function KpiSkeleton() {
  return (
    <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14, opacity: 0.5 }}>
      <div style={{ height: 14, width: '60%', background: 'var(--bg-surface-3)', borderRadius: 6 }} />
      <div style={{ height: 32, width: '80%', background: 'var(--bg-surface-3)', borderRadius: 6 }} />
      <div style={{ height: 12, width: '50%', background: 'var(--bg-surface-3)', borderRadius: 6 }} />
    </div>
  );
}

export function DashboardView({ onNavigate }: { onNavigate?: (v: ViewId) => void }) {
  const [sucursales, setSucursales] = useState<SucursalDTO[]>([]);
  const [sucursalId, setSucursalId] = useState<number | null>(null);
  const [periodo, setPeriodo] = useState(currentPeriodo());
  const [, setKpiData] = useState<RespuestaKpis | null>(null);
  const [kpiStatus, setKpiStatus] = useState<'idle' | 'loading' | 'error' | 'nodata'>('idle');
  const [kpiCards, setKpiCards] = useState<KpiCard[]>([]);

  useEffect(() => {
    const ac = new AbortController();
    listarSucursales(ac.signal)
      .then(list => {
        setSucursales(list);
        if (list.length > 0) setSucursalId(list[0].id);
      })
      .catch(() => {});
    return () => ac.abort();
  }, []);

  const fetchKpis = useCallback(async (sid: number, per: string) => {
    setKpiStatus('loading');
    setKpiData(null);
    const ac = new AbortController();
    try {
      const data = await obtenerKpis(sid, per, ac.signal);
      setKpiData(data);
      setKpiCards(kpisFromResponse(data));
      setKpiStatus('idle');
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      if (err instanceof ApiError && err.status === 404) {
        setKpiStatus('nodata');
      } else {
        setKpiStatus('error');
      }
    }
  }, []);

  useEffect(() => {
    if (sucursalId == null || !periodo) return;
    fetchKpis(sucursalId, periodo);
  }, [sucursalId, periodo, fetchKpis]);

  const sucursalNombre = sucursales.find(s => s.id === sucursalId)?.nombre ?? '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Selectores */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', flexWrap: 'wrap' }}>
        <span className="ds-label" style={{ marginRight: 2 }}>Ver KPIs de</span>
        <div style={{ position: 'relative' }}>
          <select className="input select" value={sucursalId ?? ''} onChange={e => setSucursalId(Number(e.target.value))}
            style={{ height: 34, paddingLeft: 32, paddingRight: 14, minWidth: 200 }}>
            {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
          <Icon name="map-pin" size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
        </div>
        <div style={{ position: 'relative' }}>
          <input
            type="month"
            className="input"
            value={periodo}
            onChange={e => setPeriodo(e.target.value)}
            style={{ height: 34, paddingLeft: 32, paddingRight: 10, minWidth: 160 }}
          />
          <Icon name="calendar" size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
        </div>
        {kpiStatus === 'loading' && (
          <span className="ds-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="loader" size={14} />Cargando KPIs…
          </span>
        )}
      </div>

      {/* KPI row */}
      <div>
        {kpiStatus === 'nodata' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[0,1,2,3].map(i => (
              <div key={i} className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="inbox" size={24} style={{ color: 'var(--text-disabled)' }} />
                <div className="ds-sm" style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: 12 }}>No hay datos para el período seleccionado</div>
              </div>
            ))}
          </div>
        ) : kpiStatus === 'error' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[0,1,2,3].map(i => (
              <div key={i} className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="alert-circle" size={24} style={{ color: 'var(--color-danger)' }} />
                <div className="ds-sm" style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: 12 }}>Error al cargar</div>
                <button className="btn btn-ghost btn-sm" onClick={() => sucursalId && fetchKpis(sucursalId, periodo)}>Reintentar</button>
              </div>
            ))}
          </div>
        ) : kpiStatus === 'loading' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[0,1,2,3].map(i => <KpiSkeleton key={i} />)}
          </div>
        ) : kpiCards.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {kpiCards.map(k => <KpiCardCA key={k.id} kpi={k} />)}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[0,1,2,3].map(i => <KpiSkeleton key={i} />)}
          </div>
        )}
        <div className="ds-label" style={{ fontSize: 11, marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-disabled)' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-success)' }} />
          {sucursalNombre ? `${sucursalNombre} · ${periodo}` : 'Selecciona sucursal y período'}
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

    </div>
  );
}
