import { useState, useEffect, useCallback, Fragment } from 'react';
import { Icon } from '../components/Icon';
import { Badge, Panel } from '../components/Primitives';
import { listarDatos, reprocesarDato, logDato } from '../api/datos';
import { listarSucursales } from '../api/sucursales';
import type { DatoConsolidadoDTO, LogTrazabilidadDTO, SucursalDTO } from '../api/types';
import type { DatosFiltros } from '../api/datos';

const ESTADO_KIND: Record<string, string> = {
  PROCESADO: 'success',
  VALIDADO: 'info',
  RECIBIDO: 'neutral',
  ERROR: 'danger',
};

const ESTADOS = ['RECIBIDO', 'VALIDADO', 'PROCESADO', 'ERROR'];
const TIPOS = ['VENTA', 'INVENTARIO', 'DEVOLUCCION', 'TRANSFERENCIA', 'AJUSTE_INVENTARIO'];

function formatDate(dt: string): string {
  try { return new Date(dt).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' }); }
  catch { return dt; }
}

function ultimoDiaDelMes(mes: string): string {
  // mes = "YYYY-MM" → "YYYY-MM-DD" del último día
  const [y, m] = mes.split('-').map(Number);
  const dia = new Date(y, m, 0).getDate();
  return `${mes}-${String(dia).padStart(2, '0')}`;
}

function formatPeriodo(p: string): string {
  try {
    const d = new Date(p + 'T00:00:00');
    return d.toLocaleDateString('es-CL', { year: 'numeric', month: 'short' });
  } catch { return p; }
}

function parseValor(tipoDato: string, valorJson: string | null | undefined): string {
  if (!valorJson) return '—';
  try {
    const v = JSON.parse(valorJson);
    const clp = (n: number) => '$' + Math.round(n).toLocaleString('es-CL');
    switch (tipoDato) {
      case 'VENTA':
        return `${v.categoria ?? ''} · ${clp(v.total ?? 0)} · ${v.transacciones ?? 0} tx · ${v.canal ?? ''}`;
      case 'INVENTARIO':
        return `${v.sku ?? ''} · ${v.descripcion ?? ''} · Stock: ${v.stock_actual ?? 0} / mín: ${v.stock_minimo ?? 0}`;
      case 'DEVOLUCCION':
        return `${v.motivo ?? ''} · ${clp(v.monto ?? 0)} · ${v.unidades ?? 0} und`;
      case 'TRANSFERENCIA':
        return `S${v.sucursal_origen ?? '?'} → S${v.sucursal_destino ?? '?'} · ${v.sku ?? ''} · ${v.unidades ?? 0} uds`;
      case 'AJUSTE_INVENTARIO':
        return `${v.tipo ?? ''} · ${v.sku ?? ''} · ${v.cantidad ?? 0} uds · ${v.motivo ?? ''}`;
      default:
        return valorJson.length > 80 ? valorJson.slice(0, 80) + '…' : valorJson;
    }
  } catch {
    return valorJson.length > 80 ? valorJson.slice(0, 80) + '…' : valorJson;
  }
}

function LogTimeline({ id, onClose }: { id: number; onClose: () => void }) {
  const [log, setLog] = useState<LogTrazabilidadDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ac = new AbortController();
    logDato(id, ac.signal).then(data => { setLog(data); setLoading(false); }).catch(() => setLoading(false));
    return () => ac.abort();
  }, [id]);

  return (
    <div style={{ padding: '14px 16px', background: 'var(--bg-surface-1)', borderBottom: '1px solid var(--bg-border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <span className="ds-label" style={{ fontWeight: 600 }}>Trazabilidad del registro</span>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><Icon name="x" size={14} /></button>
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 16 }}><Icon name="loader" size={16} style={{ color: 'var(--text-disabled)' }} /></div>
      ) : log.length === 0 ? (
        <div className="ds-sm" style={{ color: 'var(--text-secondary)' }}>Sin registros de trazabilidad.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {log.map((entry, i) => (
            <div key={entry.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', paddingBottom: i < log.length - 1 ? 12 : 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-' + (ESTADO_KIND[entry.accion] || 'neutral') + ')', flex: 'none', marginTop: 2 }} />
                {i < log.length - 1 && <div style={{ width: 2, flex: 1, background: 'var(--bg-border)', minHeight: 12 }} />}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Badge kind={ESTADO_KIND[entry.accion] || 'neutral'}>{entry.accion}</Badge>
                  <span className="ds-label" style={{ fontSize: 11 }}>{formatDate(entry.createdAt)}</span>
                </div>
                {entry.detalle && <div className="ds-sm" style={{ marginTop: 4, color: 'var(--text-secondary)', fontSize: 12 }}>{entry.detalle}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function periodoActual(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function restarMeses(ym: string, n: number): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 - n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function mesLegible(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('es-CL', { month: 'short', year: 'numeric' });
}

const RANGOS_RAPIDOS = [
  { label: 'Últimos 3 meses', meses: 3 },
  { label: 'Últimos 6 meses', meses: 6 },
  { label: 'Últimos 12 meses', meses: 12 },
];

export function DatosView() {
  const [sucursales, setSucursales] = useState<SucursalDTO[]>([]);
  const [datos, setDatos] = useState<DatoConsolidadoDTO[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'ok'>('loading');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [reprocesando, setReprocesando] = useState<Set<number>>(new Set());

  const [filtros, setFiltros] = useState<DatosFiltros>({});
  const [sucursalId, setSucursalId] = useState<number | ''>('');
  const [tipoDato, setTipoDato] = useState('');
  const [periodoDesde, setPeriodoDesde] = useState('');
  const [periodoHasta, setPeriodoHasta] = useState('');
  const [estado, setEstado] = useState('');

  useEffect(() => {
    listarSucursales().then(setSucursales).catch(() => {});
  }, []);

  const fetchDatos = useCallback(async (f: DatosFiltros) => {
    setStatus('loading');
    const ac = new AbortController();
    try {
      const data = await listarDatos(f, ac.signal);
      setDatos(data);
      setStatus('ok');
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setStatus('error');
    }
  }, []);

  useEffect(() => { fetchDatos(filtros); }, [filtros, fetchDatos]);

  function applyFiltros() {
    const f: DatosFiltros = {};
    if (sucursalId !== '') f.sucursalId = sucursalId as number;
    if (tipoDato) f.tipoDato = tipoDato;
    // Los datos son mensuales (día 1). El input "month" entrega YYYY-MM:
    // desde = primer día del mes; hasta = último día del mes (inclusivo).
    if (periodoDesde) f.periodoDesde = `${periodoDesde}-01`;
    if (periodoHasta) f.periodoHasta = ultimoDiaDelMes(periodoHasta);
    if (estado) f.estado = estado;
    setFiltros(f);
  }

  // Atajo: fija el rango a los últimos N meses y aplica de inmediato.
  function aplicarRango(nMeses: number) {
    const hasta = periodoActual();
    const desde = restarMeses(hasta, nMeses - 1);
    setPeriodoDesde(desde);
    setPeriodoHasta(hasta);
    const f: DatosFiltros = {};
    if (sucursalId !== '') f.sucursalId = sucursalId as number;
    if (tipoDato) f.tipoDato = tipoDato;
    f.periodoDesde = `${desde}-01`;
    f.periodoHasta = ultimoDiaDelMes(hasta);
    if (estado) f.estado = estado;
    setFiltros(f);
  }

  function clearFiltros() {
    setSucursalId(''); setTipoDato(''); setPeriodoDesde(''); setPeriodoHasta(''); setEstado('');
    setFiltros({});
  }

  async function handleReprocesar(id: number) {
    setReprocesando(prev => new Set(prev).add(id));
    try {
      await reprocesarDato(id);
      setDatos(prev => prev.map(d => d.id === id ? { ...d, estado: 'RECIBIDO' } : d));
    } catch {
      // silencioso — podría mostrar toast
    } finally {
      setReprocesando(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Filtros */}
      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 12, padding: '14px 16px' }}>
        <div className="field" style={{ minWidth: 180 }}>
          <label className="field-label">Sucursal</label>
          <select className="input select" value={sucursalId} onChange={e => setSucursalId(e.target.value === '' ? '' : Number(e.target.value))} style={{ height: 34 }}>
            <option value="">Todas</option>
            {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </div>
        <div className="field" style={{ minWidth: 160 }}>
          <label className="field-label">Tipo de dato</label>
          <select className="input select" value={tipoDato} onChange={e => setTipoDato(e.target.value)} style={{ height: 34 }}>
            <option value="">Todos</option>
            {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="field" style={{ minWidth: 320 }}>
          <label className="field-label">Período</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <Icon name="calendar" size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
              <input className="input" type="month" value={periodoDesde} max={periodoHasta || undefined}
                onChange={e => setPeriodoDesde(e.target.value)} style={{ height: 34, paddingLeft: 28, width: 150 }} title="Mes inicial" />
            </div>
            <Icon name="arrow-right" size={14} style={{ color: 'var(--text-disabled)', flex: 'none' }} />
            <div style={{ position: 'relative' }}>
              <Icon name="calendar" size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
              <input className="input" type="month" value={periodoHasta} min={periodoDesde || undefined}
                onChange={e => setPeriodoHasta(e.target.value)} style={{ height: 34, paddingLeft: 28, width: 150 }} title="Mes final" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {RANGOS_RAPIDOS.map(r => (
              <button key={r.meses} className="btn btn-ghost btn-sm" style={{ height: 24, fontSize: 11, padding: '0 8px' }} onClick={() => aplicarRango(r.meses)}>
                {r.label}
              </button>
            ))}
            {(periodoDesde || periodoHasta) && (
              <span className="ds-label" style={{ fontSize: 11, color: 'var(--text-secondary)', marginLeft: 2 }}>
                {periodoDesde ? mesLegible(periodoDesde) : '…'} → {periodoHasta ? mesLegible(periodoHasta) : '…'}
              </span>
            )}
          </div>
        </div>
        <div className="field" style={{ minWidth: 140 }}>
          <label className="field-label">Estado</label>
          <select className="input select" value={estado} onChange={e => setEstado(e.target.value)} style={{ height: 34 }}>
            <option value="">Todos</option>
            {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 8, paddingBottom: 1 }}>
          <button className="btn btn-primary btn-sm" style={{ height: 34 }} onClick={applyFiltros}>Aplicar</button>
          <button className="btn btn-ghost btn-sm" style={{ height: 34 }} onClick={clearFiltros}>Limpiar</button>
        </div>
      </div>

      {/* Tabla */}
      <Panel style={{ padding: 0 }} bodyStyle={{ padding: 0 }} title="Datos consolidados"
        action={<span className="ds-label">{status === 'ok' ? `${datos.length} registros` : ''}</span>}>
        {status === 'loading' ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <Icon name="loader" size={20} style={{ color: 'var(--text-disabled)' }} />
            <div className="ds-sm" style={{ marginTop: 8, color: 'var(--text-secondary)' }}>Cargando datos…</div>
          </div>
        ) : status === 'error' ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div role="alert">
              <Icon name="alert-circle" size={22} style={{ color: 'var(--color-danger)' }} />
              <div className="ds-sm" style={{ marginTop: 8 }}>Ha ocurrido un error inesperado. Intente más tarde.</div>
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={() => fetchDatos(filtros)}>Reintentar</button>
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th />
                  <th>Fuente</th>
                  <th>Sucursal</th>
                  <th>Tipo de dato</th>
                  <th>Período</th>
                  <th>Valor</th>
                  <th>Estado</th>
                  <th>Recibido</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {datos.map(d => (
                  <Fragment key={d.id}>
                    <tr style={{ cursor: 'pointer' }}>
                      <td>
                        <button className="btn btn-ghost btn-icon btn-sm" title="Ver trazabilidad" onClick={() => setExpanded(expanded === d.id ? null : d.id)}>
                          <Icon name={expanded === d.id ? 'chevron-up' : 'chevron-down'} size={14} />
                        </button>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{d.fuenteNombre}</td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{d.sucursalNombre}</td>
                      <td className="ds-mono" style={{ fontSize: 12 }}>{d.tipoDato}</td>
                      <td className="ds-mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatPeriodo(d.periodo)}</td>
                      <td style={{ color: 'var(--text-primary)', fontSize: 12, maxWidth: 360, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={d.valor ?? ''}>{parseValor(d.tipoDato, d.valor)}</td>
                      <td><Badge kind={ESTADO_KIND[d.estado] || 'neutral'}>{d.estado}</Badge></td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{formatDate(d.createdAt)}</td>
                      <td>
                        {d.estado === 'ERROR' && (
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ height: 28, display: 'flex', alignItems: 'center', gap: 4 }}
                            disabled={reprocesando.has(d.id)}
                            onClick={() => handleReprocesar(d.id)}
                          >
                            {reprocesando.has(d.id) ? <><Icon name="loader" size={12} />Reprocesando…</> : <><Icon name="refresh-cw" size={12} />Reprocesar</>}
                          </button>
                        )}
                      </td>
                    </tr>
                    {expanded === d.id && (
                      <tr>
                        <td colSpan={9} style={{ padding: 0 }}>
                          <LogTimeline id={d.id} onClose={() => setExpanded(null)} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
            {datos.length === 0 && (
              <div style={{ padding: '40px 16px', textAlign: 'center' }}>
                <Icon name="database" size={22} style={{ color: 'var(--text-disabled)' }} />
                <div className="ds-sm" style={{ marginTop: 8 }}>No hay datos para los filtros seleccionados</div>
              </div>
            )}
          </div>
        )}
      </Panel>
    </div>
  );
}
