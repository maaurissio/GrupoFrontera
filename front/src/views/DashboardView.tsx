import { useState, useEffect, useCallback } from 'react';
import { Icon } from '../components/Icon';
import { Badge, Delta, Panel } from '../components/Primitives';
import { LineChart } from '../components/Chart';
import { EditarKpisModal } from '../components/EditarKpisModal';
import { DATA } from '../data';
import type { ViewId } from '../data';
import { listarSucursales } from '../api/sucursales';
import { obtenerComparativo } from '../api/kpis';
import type { SucursalDTO, RespuestaKpis } from '../api/types';
import { ultimosMeses, type ChartSeries } from '../utils/periodo';
import { useAuth } from '../context/AuthContext';
import { puedeVerUsuariosYRoles, puedeEditarKpis } from '../utils/permisos';

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

// Agrega un conjunto de filas (una o varias sucursales) en un solo set de KPIs.
interface Agregado {
  totalVentas: number;
  transacciones: number;
  ticketPromedio: number;
  metaMensual: number;
  porcentajeCumplimiento: number;
  productosBajoMinimo: number;
  hay: boolean;
}

function agregar(rows: RespuestaKpis[]): Agregado {
  const totalVentas = rows.reduce((s, r) => s + Number(r.totalVentas), 0);
  const transacciones = rows.reduce((s, r) => s + Number(r.cantidadTransacciones), 0);
  const metaMensual = rows.reduce((s, r) => s + Number(r.metaMensual), 0);
  const productosBajoMinimo = rows.reduce((s, r) => s + Number(r.productosBajoMinimo), 0);
  return {
    totalVentas,
    transacciones,
    ticketPromedio: transacciones > 0 ? totalVentas / transacciones : 0,
    metaMensual,
    porcentajeCumplimiento: metaMensual > 0 ? (totalVentas / metaMensual) * 100 : 0,
    productosBajoMinimo,
    hay: rows.length > 0,
  };
}

function kpisFromAgregado(a: Agregado): KpiCard[] {
  const pct = a.porcentajeCumplimiento;
  return [
    {
      id: 'ventas', label: 'Ventas totales', value: fmtClp(a.totalVentas),
      icon: 'dollar-sign', accent: 'info', sub: `Meta: ${fmtClp(a.metaMensual)}`,
      desc: 'Monto total facturado en el alcance seleccionado.',
    },
    {
      id: 'tx', label: 'Transacciones', value: a.transacciones.toLocaleString('es-CL'),
      icon: 'shopping-cart', accent: 'neutral',
      desc: 'Cantidad de ventas registradas en el alcance seleccionado.',
    },
    {
      id: 'ticket', label: 'Ticket promedio', value: fmtClp(a.ticketPromedio),
      icon: 'receipt', accent: 'neutral',
      desc: 'Ventas dividido por número de transacciones.',
    },
    {
      id: 'meta', label: '% Cumplimiento meta', value: `${pct.toFixed(1)}%`,
      icon: 'target', accent: metaKind(pct),
      badge: pct < 60 ? { text: 'Por debajo de meta', kind: 'danger' }
           : pct < 90 ? { text: 'En progreso', kind: 'warning' }
           : { text: 'Meta alcanzada', kind: 'success' },
      desc: 'Ventas acumuladas sobre la meta acumulada.',
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

type Scope = 'mes' | 'todos';
type Status = 'idle' | 'loading' | 'error' | 'nodata';

export function DashboardView({ onNavigate }: { onNavigate?: (v: ViewId) => void }) {
  const { usuario } = useAuth();
  const modulos = DATA.modules.filter(m => m.id === 'usuarios' ? puedeVerUsuariosYRoles(usuario?.roles ?? []) : true);
  const puedeEditar = puedeEditarKpis(usuario?.roles ?? []);
  const [sucursales, setSucursales] = useState<SucursalDTO[]>([]);
  const [sucursalSel, setSucursalSel] = useState<number | 'all'>('all');
  const [scope, setScope] = useState<Scope>('mes');
  const [periodo, setPeriodo] = useState(currentPeriodo());
  const [showEditarKpis, setShowEditarKpis] = useState(false);
  const [kpiActualParaEditar, setKpiActualParaEditar] = useState<RespuestaKpis | null>(null);

  const [kpiStatus, setKpiStatus] = useState<Status>('idle');
  const [kpiCards, setKpiCards] = useState<KpiCard[]>([]);
  const [chartData, setChartData] = useState<ChartSeries | null>(null);
  const [chartStatus, setChartStatus] = useState<Status>('idle');

  useEffect(() => {
    const ac = new AbortController();
    listarSucursales(ac.signal).then(setSucursales).catch(() => {});
    return () => ac.abort();
  }, []);

  // Filtra las filas de un mes según la sucursal seleccionada.
  const seleccionar = useCallback((rows: RespuestaKpis[], suc: number | 'all') =>
    suc === 'all' ? rows : rows.filter(r => r.sucursalId === suc), []);

  const fetchKpis = useCallback(async (per: string, suc: number | 'all', sc: Scope) => {
    setKpiStatus('loading');
    try {
      if (sc === 'mes') {
        const rows = await obtenerComparativo(per);
        const sel = seleccionar(Array.isArray(rows) ? rows : [], suc);
        const agg = agregar(sel);
        if (!agg.hay) { setKpiStatus('nodata'); setKpiActualParaEditar(null); return; }
        setKpiCards(kpisFromAgregado(agg));
        setKpiActualParaEditar(suc !== 'all' && sel.length > 0 ? sel[0] : null);
        setKpiStatus('idle');
      } else {
        // 'todos': itera los últimos 12 meses y agrega todo.
        const meses = ultimosMeses(per, 12);
        const porMes = await Promise.all(
          meses.map(mo => obtenerComparativo(mo.periodo).catch(() => [] as RespuestaKpis[])),
        );
        const seleccionados = porMes.map(rows => seleccionar(Array.isArray(rows) ? rows : [], suc));
        const todas = seleccionados.flat();
        if (todas.length === 0) { setKpiStatus('nodata'); return; }
        const agg = agregar(todas);
        // productosBajoMinimo: usa el del último mes con datos (no acumular un flujo de stock).
        let bajoMinimoUltimo = 0;
        for (let i = seleccionados.length - 1; i >= 0; i--) {
          if (seleccionados[i].length > 0) {
            bajoMinimoUltimo = seleccionados[i].reduce((s, r) => s + Number(r.productosBajoMinimo), 0);
            break;
          }
        }
        agg.productosBajoMinimo = bajoMinimoUltimo;
        setKpiCards(kpisFromAgregado(agg));
        setKpiStatus('idle');
      }
    } catch {
      setKpiStatus('error');
    }
  }, [seleccionar]);

  // Gráfico de 6 meses, respeta sucursalSel (igual que ReportesView.fetchChart).
  const fetchChart = useCallback(async (per: string, suc: number | 'all') => {
    setChartStatus('loading');
    const meses = ultimosMeses(per, 6);
    try {
      const porMes = await Promise.all(
        meses.map(mo => obtenerComparativo(mo.periodo).catch(() => [] as RespuestaKpis[])),
      );
      const agregados = porMes.map(rows => {
        const sel = seleccionar(Array.isArray(rows) ? rows : [], suc);
        return {
          ventas: sel.reduce((s, r) => s + Number(r.totalVentas), 0),
          tx: sel.reduce((s, r) => s + Number(r.cantidadTransacciones), 0),
          hay: sel.length > 0,
        };
      });
      if (!agregados.some(a => a.hay)) {
        setChartData(null);
        setChartStatus('nodata');
        return;
      }
      setChartData({
        months: meses.map(m => m.corto),
        fullLabels: meses.map(m => m.full),
        ventas: agregados.map(a => a.ventas / 1_000_000),
        tx: agregados.map(a => a.tx),
      });
      setChartStatus('idle');
    } catch {
      setChartStatus('error');
    }
  }, [seleccionar]);

  useEffect(() => {
    if (!periodo) return;
    fetchKpis(periodo, sucursalSel, scope);
    fetchChart(periodo, sucursalSel);
  }, [periodo, sucursalSel, scope, fetchKpis, fetchChart]);

  const sucursalNombre = sucursalSel === 'all'
    ? 'Todas las sucursales'
    : sucursales.find(s => s.id === sucursalSel)?.nombre ?? '';

  const alcanceLabel = scope === 'mes' ? periodo : 'Últimos 12 meses';

  return (
    <>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Selectores */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', flexWrap: 'wrap' }}>
        <span className="ds-label" style={{ marginRight: 2 }}>Ver KPIs de</span>
        <div style={{ position: 'relative' }}>
          <select className="input select" value={sucursalSel}
            onChange={e => setSucursalSel(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            style={{ height: 34, paddingLeft: 32, paddingRight: 14, minWidth: 200 }}>
            <option value="all">Todas las sucursales</option>
            {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
          <Icon name="map-pin" size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
        </div>

        {/* Alcance: Mes vs Todos los meses */}
        <div style={{ display: 'inline-flex', border: '1px solid var(--bg-border)', borderRadius: 8, overflow: 'hidden', height: 34 }}>
          {(['mes', 'todos'] as Scope[]).map(sc => (
            <button key={sc}
              className={'btn btn-sm ' + (scope === sc ? 'btn-primary' : 'btn-ghost')}
              style={{ height: 32, borderRadius: 0, border: 'none' }}
              onClick={() => setScope(sc)}>
              {sc === 'mes' ? 'Mes' : 'Todos los meses'}
            </button>
          ))}
        </div>

        {scope === 'mes' && (
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
        )}
        {kpiStatus === 'loading' && (
          <span className="ds-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="loader" size={14} />Cargando KPIs…
          </span>
        )}
        {puedeEditar && scope === 'mes' && sucursalSel !== 'all' && (
          <button className="btn btn-secondary btn-sm" style={{ height: 34, display: 'flex', alignItems: 'center', gap: 5, marginLeft: 'auto' }}
            onClick={() => setShowEditarKpis(true)}>
            <Icon name="pencil" size={13} />Editar KPIs
          </button>
        )}
      </div>

      {/* KPI row */}
      <div>
        {kpiStatus === 'nodata' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[0,1,2,3].map(i => (
              <div key={i} className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="inbox" size={24} style={{ color: 'var(--text-disabled)' }} />
                <div className="ds-sm" style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: 12 }}>No hay datos para el alcance seleccionado</div>
              </div>
            ))}
          </div>
        ) : kpiStatus === 'error' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[0,1,2,3].map(i => (
              <div key={i} className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="alert-circle" size={24} style={{ color: 'var(--color-danger)' }} />
                <div className="ds-sm" style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: 12 }}>Error al cargar</div>
                <button className="btn btn-ghost btn-sm" onClick={() => fetchKpis(periodo, sucursalSel, scope)}>Reintentar</button>
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
          {sucursalNombre ? `${sucursalNombre} · ${alcanceLabel}` : 'Selecciona sucursal y período'}
        </div>
      </div>

      {/* chart + modules */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.55fr) minmax(0,1fr)', gap: 16 }}>
        <Panel title="Ventas en el tiempo" action={
          chartData && (
            <span className="btn btn-secondary btn-sm" style={{ height: 30, display: 'flex', alignItems: 'center', gap: 6, cursor: 'default' }}>
              <Icon name="calendar" size={13} />{chartData.fullLabels[0]} – {chartData.fullLabels[chartData.fullLabels.length - 1]}
            </span>
          )
        }>
          {chartStatus === 'loading' ? (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="loader" size={20} style={{ color: 'var(--text-disabled)' }} />
            </div>
          ) : chartStatus === 'error' ? (
            <div style={{ height: 220, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="alert-circle" size={22} style={{ color: 'var(--color-danger)' }} />
              <div className="ds-sm" style={{ color: 'var(--text-secondary)' }}>Error al cargar la serie</div>
              <button className="btn btn-ghost btn-sm" onClick={() => fetchChart(periodo, sucursalSel)}>Reintentar</button>
            </div>
          ) : chartData ? (
            <LineChart data={chartData} height={220} />
          ) : (
            <div style={{ height: 220, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="inbox" size={24} style={{ color: 'var(--text-disabled)' }} />
              <div className="ds-sm" style={{ color: 'var(--text-secondary)' }}>No hay ventas registradas en el período</div>
            </div>
          )}
        </Panel>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignContent: 'start' }}>
          {modulos.map(m => (
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

    {showEditarKpis && sucursalSel !== 'all' && (
      <EditarKpisModal
        sucursalId={sucursalSel}
        sucursalNombre={sucursalNombre}
        periodo={periodo}
        kpiActual={kpiActualParaEditar}
        onClose={() => setShowEditarKpis(false)}
        onGuardado={() => fetchKpis(periodo, sucursalSel, scope)}
      />
    )}
    </>
  );
}
