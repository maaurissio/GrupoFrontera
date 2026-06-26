import { useState, useEffect, useCallback } from 'react';
import { Icon } from '../components/Icon';
import { Badge, Delta, Panel } from '../components/Primitives';
import { LineChart } from '../components/Chart';
import { EditarKpisModal } from '../components/EditarKpisModal';
import { listarSucursales } from '../api/sucursales';
import { obtenerComparativo } from '../api/kpis';
import { exportarReporte } from '../api/reportes';
import type { SucursalDTO, RespuestaKpis } from '../api/types';
import { rangoMeses, type ChartSeries } from '../utils/periodo';
import { useAuth } from '../context/AuthContext';
import { puedeEditarKpis } from '../utils/permisos';

function currentPeriodo(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function periodoHaceN(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function fmtClp(n: number): string {
  return '$' + Math.round(n).toLocaleString('es-CL');
}

function metaKind(p: number) { return p > 90 ? 'success' : p >= 60 ? 'warning' : 'danger'; }
function metaColor(p: number) { return 'var(--color-' + metaKind(p) + ')'; }

export function ReportesView() {
  const { usuario } = useAuth();
  const puedeEditar = puedeEditarKpis(usuario?.roles ?? []);

  const [sucursales, setSucursales] = useState<SucursalDTO[]>([]);
  const [sucursalId, setSucursalId] = useState<number | 'all'>('all');
  const [periodo, setPeriodo] = useState(currentPeriodo());
  const [periodoDesde, setPeriodoDesde] = useState(periodoHaceN(11));
  const [comparativo, setComparativo] = useState<RespuestaKpis[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [errorData, setErrorData] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartSeries | null>(null);
  const [chartStatus, setChartStatus] = useState<'idle' | 'loading' | 'error' | 'nodata'>('idle');
  const [showEditarKpis, setShowEditarKpis] = useState(false);

  useEffect(() => {
    const ac = new AbortController();
    listarSucursales(ac.signal).then(setSucursales).catch(() => {});
    return () => ac.abort();
  }, []);

  const fetchComparativo = useCallback(async (per: string) => {
    setLoadingData(true);
    setErrorData(false);
    const ac = new AbortController();
    try {
      const data = await obtenerComparativo(per, ac.signal);
      setComparativo(Array.isArray(data) ? data : []);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setErrorData(true);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (periodo) fetchComparativo(periodo);
  }, [periodo, fetchComparativo]);

  // Gráfico: carga todos los meses en el rango [periodoDesde, periodo]
  const fetchChart = useCallback(async (desde: string, hasta: string, suc: number | 'all') => {
    // Validar que desde <= hasta
    if (desde > hasta) return;
    setChartStatus('loading');
    const meses = rangoMeses(desde, hasta);
    try {
      const porMes = await Promise.all(
        meses.map(mo => obtenerComparativo(mo.periodo).catch(() => [] as RespuestaKpis[])),
      );
      const agregados = porMes.map(rows => {
        const sel = suc === 'all' ? rows : rows.filter(r => r.sucursalId === suc);
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
  }, []);

  useEffect(() => {
    if (periodo && periodoDesde) fetchChart(periodoDesde, periodo, sucursalId);
  }, [periodo, periodoDesde, sucursalId, fetchChart]);

  async function doExport(fmt: 'pdf' | 'xlsx') {
    setExporting(fmt);
    setExportError(null);
    try {
      await exportarReporte(sucursalId === 'all' ? null : sucursalId, periodo, fmt);
    } catch (err) {
      const status = (err as { status?: number }).status;
      const alcance = sucursalId === 'all' ? 'ninguna sucursal' : 'esta sucursal';
      setExportError(
        status === 404
          ? `No hay KPIs para ${alcance} en ${periodo}. Elige otro período.`
          : 'No se pudo generar el reporte. Intenta nuevamente.',
      );
    } finally {
      setExporting(null);
    }
  }

  const sucMap = Object.fromEntries(sucursales.map(s => [s.id, s.nombre]));

  const allRows = comparativo.map(k => ({
    id: k.sucursalId,
    name: sucMap[k.sucursalId] ?? `Sucursal #${k.sucursalId}`,
    sales: Number(k.totalVentas),
    tx: k.cantidadTransacciones,
    ticket: Number(k.ticketPromedio),
    meta: Number(k.porcentajeCumplimiento),
    bajoMin: k.productosBajoMinimo,
  }));

  const filtered = sucursalId === 'all' ? allRows : allRows.filter(r => r.id === sucursalId);
  const ranked = [...filtered].sort((a, b) => b.sales - a.sales);

  const totalSales = filtered.reduce((s, b) => s + b.sales, 0);
  const totalTx = filtered.reduce((s, b) => s + b.tx, 0);
  const avgTicket = totalTx > 0 ? Math.round(totalSales / totalTx) : 0;
  const avgMeta = filtered.length > 0 ? Math.round(filtered.reduce((s, b) => s + b.meta, 0) / filtered.length) : 0;
  const totalBajoMin = filtered.reduce((s, b) => s + (b.bajoMin ?? 0), 0);

  const kpiActualParaEditar = sucursalId !== 'all'
    ? comparativo.find(k => k.sucursalId === sucursalId) ?? null
    : null;
  const sucursalNombreEditar = sucursalId !== 'all'
    ? (sucMap[sucursalId] ?? `Sucursal #${sucursalId}`)
    : '';

  const kpis = [
    { label: 'Total ventas', value: fmtClp(totalSales) },
    { label: 'Ticket promedio', value: fmtClp(avgTicket) },
    { label: 'Transacciones', value: totalTx.toLocaleString('es-CL') },
  ];

  return (
    <>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* filters */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', flexWrap: 'wrap' }}>
        <span className="ds-label" style={{ marginRight: 2 }}>Ver</span>
        <div style={{ position: 'relative' }}>
          <select className="input select" value={sucursalId} onChange={e => setSucursalId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            style={{ height: 34, paddingLeft: 32, paddingRight: 14, minWidth: 200 }}>
            <option value="all">Todas las sucursales</option>
            {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
          <Icon name="map-pin" size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
        </div>

        {/* Rango de fechas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="ds-label">Desde</span>
          <div style={{ position: 'relative' }}>
            <input type="month" className="input" value={periodoDesde}
              max={periodo}
              onChange={e => setPeriodoDesde(e.target.value)}
              style={{ height: 34, paddingLeft: 32, paddingRight: 10, minWidth: 150 }} />
            <Icon name="calendar" size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
          </div>
          <span className="ds-label">Hasta</span>
          <div style={{ position: 'relative' }}>
            <input type="month" className="input" value={periodo}
              min={periodoDesde}
              onChange={e => setPeriodo(e.target.value)}
              style={{ height: 34, paddingLeft: 32, paddingRight: 10, minWidth: 150 }} />
            <Icon name="calendar" size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
          </div>
        </div>

        {sucursalId !== 'all' && (
          <button className="btn btn-ghost btn-sm" onClick={() => setSucursalId('all')} style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="x" size={12} />Todas
          </button>
        )}

        <div style={{ flex: 1 }} />

        {/* Editar KPIs — solo para roles con permisos, solo con sucursal específica */}
        {puedeEditar && sucursalId !== 'all' && (
          <button className="btn btn-secondary btn-sm" style={{ height: 34, display: 'flex', alignItems: 'center', gap: 5 }}
            onClick={() => setShowEditarKpis(true)}>
            <Icon name="pencil" size={13} />Editar KPIs
          </button>
        )}

        <button className="btn btn-secondary btn-sm" style={{ height: 34, display: 'flex', alignItems: 'center', gap: 6 }}
          disabled={!!exporting}
          title={sucursalId === 'all' ? 'Exportar informe consolidado de todas las sucursales' : 'Exportar informe detallado'}
          onClick={() => doExport('pdf')}>
          {exporting === 'pdf' ? <><Icon name="loader" size={14} />Generando…</> : <><Icon name="file-text" size={14} />Informe PDF</>}
        </button>
        <button className="btn btn-primary btn-sm" style={{ height: 34, display: 'flex', alignItems: 'center', gap: 6 }}
          disabled={!!exporting}
          title={sucursalId === 'all' ? 'Exportar informe consolidado de todas las sucursales' : 'Exportar informe detallado'}
          onClick={() => doExport('xlsx')}>
          {exporting === 'xlsx' ? <><Icon name="loader" size={14} />Generando…</> : <><Icon name="table" size={14} />Informe Excel</>}
        </button>
      </div>

      {exportError && (
        <div role="alert" className="card" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}>
          <Icon name="alert-circle" size={16} />
          <span className="ds-sm">{exportError}</span>
          <button className="btn btn-ghost btn-icon btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setExportError(null)}><Icon name="x" size={14} /></button>
        </div>
      )}

      {/* KPI cards — reflejan el mes "Hasta" seleccionado */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        {kpis.map(k => (
          <div key={k.label} className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span className="kpi-label">{k.label}</span>
            <div className="ds-kpi" style={{ fontSize: 28 }}>{loadingData ? '—' : k.value}</div>
          </div>
        ))}
        <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span className="kpi-label">% Cumplimiento meta</span>
          <div className="ds-kpi" style={{ fontSize: 28, color: metaColor(avgMeta) }}>{loadingData ? '—' : `${avgMeta}%`}</div>
          <div style={{ height: 8, background: 'var(--bg-surface-1)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ width: Math.min(avgMeta, 100) + '%', height: '100%', background: metaColor(avgMeta), borderRadius: 999 }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.55fr) minmax(0,1fr)', gap: 16 }}>
        {/* Gráfico — cubre el rango completo Desde→Hasta */}
        <Panel title="Ventas en el tiempo" action={
          chartData && <span className="ds-label">{chartData.fullLabels[0]} – {chartData.fullLabels[chartData.fullLabels.length - 1]}</span>
        }>
          {chartStatus === 'loading' ? (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="loader" size={20} style={{ color: 'var(--text-disabled)' }} />
            </div>
          ) : chartStatus === 'error' ? (
            <div style={{ height: 220, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="alert-circle" size={22} style={{ color: 'var(--color-danger)' }} />
              <div className="ds-sm" style={{ color: 'var(--text-secondary)' }}>Error al cargar la serie</div>
              <button className="btn btn-ghost btn-sm" onClick={() => fetchChart(periodoDesde, periodo, sucursalId)}>Reintentar</button>
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

        {/* Indicadores de inventario — datos del mes "Hasta" */}
        <Panel title="Indicadores del período">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Productos bajo mínimo', value: loadingData ? '—' : String(totalBajoMin), icon: 'alert-triangle', kind: 'warning' },
              { label: 'Sucursales con datos', value: loadingData ? '—' : String(filtered.length), icon: 'map-pin', kind: 'neutral' },
              { label: 'Meses en el rango', value: String(rangoMeses(periodoDesde, periodo).length), icon: 'calendar', kind: 'neutral' },
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

      {/* Tabla comparativa — snapshot del mes "Hasta" */}
      <Panel style={{ padding: 0 }} bodyStyle={{ padding: 0 }}
        title="Comparativo entre sucursales"
        action={<span className="ds-label">{periodo} · orden por ventas</span>}>
        {errorData ? (
          <div style={{ padding: 32, textAlign: 'center' }}>
            <div role="alert" style={{ color: 'var(--color-danger)' }}>
              <Icon name="alert-circle" size={20} />
              <div className="ds-sm" style={{ marginTop: 8 }}>Ha ocurrido un error inesperado. Intente más tarde.</div>
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => fetchComparativo(periodo)}>Reintentar</button>
            </div>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Sucursal</th>
                <th style={{ textAlign: 'right' }}>Total ventas</th>
                <th style={{ textAlign: 'right' }}>Meta mensual</th>
                <th style={{ textAlign: 'right' }}>Transacciones</th>
                <th style={{ textAlign: 'right' }}>Ticket prom.</th>
                <th style={{ textAlign: 'right' }}>% Meta</th>
                <th style={{ textAlign: 'right' }}>Bajo mín.</th>
              </tr>
            </thead>
            <tbody>
              {loadingData ? (
                [0,1,2,3].map(i => (
                  <tr key={i}>
                    {[0,1,2,3,4,5,6].map(j => (
                      <td key={j}><div style={{ height: 14, background: 'var(--bg-surface-3)', borderRadius: 4, opacity: 0.5 }} /></td>
                    ))}
                  </tr>
                ))
              ) : ranked.map((b, i) => (
                <tr key={b.id}>
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
                  <td className="num">{fmtClp(b.sales)}</td>
                  <td className="num" style={{ color: 'var(--text-secondary)' }}>
                    {comparativo.find(k => k.sucursalId === b.id)
                      ? fmtClp(Number(comparativo.find(k => k.sucursalId === b.id)!.metaMensual))
                      : '—'}
                  </td>
                  <td className="num" style={{ color: 'var(--text-secondary)' }}>{b.tx.toLocaleString('es-CL')}</td>
                  <td className="num" style={{ color: 'var(--text-secondary)' }}>{fmtClp(b.ticket)}</td>
                  <td className="num"><Badge kind={metaKind(b.meta)}>{b.meta.toFixed(1)}%</Badge></td>
                  <td className="num" style={{ color: (b.bajoMin ?? 0) > 0 ? 'var(--color-warning)' : 'var(--text-secondary)' }}>
                    {b.bajoMin ?? 0}
                  </td>
                </tr>
              ))}
              {!loadingData && ranked.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)' }}>Sin datos para el período seleccionado</td></tr>
              )}
            </tbody>
          </table>
        )}
      </Panel>
    </div>

    {showEditarKpis && sucursalId !== 'all' && (
      <EditarKpisModal
        sucursalId={sucursalId}
        sucursalNombre={sucursalNombreEditar}
        periodo={periodo}
        kpiActual={kpiActualParaEditar}
        onClose={() => setShowEditarKpis(false)}
        onGuardado={() => fetchComparativo(periodo)}
      />
    )}
    </>
  );
}
