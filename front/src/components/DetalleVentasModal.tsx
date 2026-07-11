import { useEffect, useState } from 'react';
import { Icon } from './Icon';
import { ModalOverlay } from './Primitives';
import { listarVentas, obtenerVentaDetalle } from '../api/kpis';
import type { SucursalDTO, VentaDetalleDTO, VentaResumenDTO } from '../api/types';

function fmtClp(n: number) { return '$' + Math.round(n).toLocaleString('es-CL'); }
function fmtFechaHora(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const PAGE_SIZE = 15;

export function DetalleVentasModal({
  sucursalId, periodoDesde, periodoHasta, sucursales, onClose,
}: {
  sucursalId: number | 'all';
  periodoDesde: string;
  periodoHasta: string;
  sucursales: SucursalDTO[];
  onClose: () => void;
}) {
  const sucMap = Object.fromEntries(sucursales.map(s => [s.id, s.nombre]));

  const [page, setPage] = useState(0);
  const [ventas, setVentas] = useState<VentaResumenDTO[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const [ventaSeleccionada, setVentaSeleccionada] = useState<VentaDetalleDTO | null>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState(false);
  const [viendoBoleta, setViendoBoleta] = useState(false);

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setError(false);
    listarVentas(
      { sucursalId: sucursalId === 'all' ? undefined : sucursalId, periodoDesde, periodoHasta, page, size: PAGE_SIZE },
      ac.signal,
    )
      .then(data => {
        setVentas(data.content);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
      })
      .catch(err => { if ((err as Error).name !== 'AbortError') setError(true); })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [sucursalId, periodoDesde, periodoHasta, page]);

  function abrirBoleta(id: number) {
    setViendoBoleta(true);
    setLoadingDetalle(true);
    setErrorDetalle(false);
    setVentaSeleccionada(null);
    obtenerVentaDetalle(id)
      .then(setVentaSeleccionada)
      .catch(() => setErrorDetalle(true))
      .finally(() => setLoadingDetalle(false));
  }

  const colSpanLista = sucursalId === 'all' ? 5 : 4;

  return (
    <ModalOverlay onClose={onClose}>
      <div className="card" style={{ width: 620, maxWidth: '95vw', maxHeight: '85vh', padding: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: '1px solid var(--bg-border)' }}>
          <div>
            <div className="ds-h3">{viendoBoleta ? 'Boleta' : 'Transacciones'}</div>
            <div className="ds-label" style={{ fontSize: 11, marginTop: 2 }}>
              {sucursalId === 'all' ? 'Todas las sucursales' : (sucMap[sucursalId] ?? `Sucursal #${sucursalId}`)} · {periodoDesde} a {periodoHasta}
            </div>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><Icon name="x" size={14} /></button>
        </div>

        <div style={{ padding: 18, overflowY: 'auto', flex: 1 }}>
          {viendoBoleta ? (
            <>
              <button className="btn btn-ghost btn-sm" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 5 }}
                onClick={() => setViendoBoleta(false)}>
                <Icon name="arrow-left" size={13} />Volver a la lista
              </button>
              {loadingDetalle ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Icon name="loader" size={20} /></div>
              ) : errorDetalle ? (
                <div className="ds-sm" style={{ color: 'var(--color-danger)', textAlign: 'center', padding: 32 }}>No se pudo cargar la boleta.</div>
              ) : ventaSeleccionada && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div className="card" style={{ padding: '8px 10px', background: 'var(--bg-surface-3)' }}>
                      <div className="ds-label" style={{ fontSize: 10 }}>Folio</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600 }}>#{ventaSeleccionada.id}</div>
                    </div>
                    <div className="card" style={{ padding: '8px 10px', background: 'var(--bg-surface-3)' }}>
                      <div className="ds-label" style={{ fontSize: 10 }}>Fecha/Hora</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600 }}>{fmtFechaHora(ventaSeleccionada.fechaHora)}</div>
                    </div>
                    <div className="card" style={{ padding: '8px 10px', background: 'var(--bg-surface-3)' }}>
                      <div className="ds-label" style={{ fontSize: 10 }}>Sucursal</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600 }}>{sucMap[ventaSeleccionada.sucursalRefId] ?? `#${ventaSeleccionada.sucursalRefId}`}</div>
                    </div>
                    <div className="card" style={{ padding: '8px 10px', background: 'var(--bg-surface-3)' }}>
                      <div className="ds-label" style={{ fontSize: 10 }}>Canal</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600 }}>{ventaSeleccionada.canal}</div>
                    </div>
                  </div>
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th style={{ textAlign: 'right' }}>Cant.</th>
                        <th style={{ textAlign: 'right' }}>Precio unit.</th>
                        <th style={{ textAlign: 'right' }}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ventaSeleccionada.items.map(it => (
                        <tr key={it.id}>
                          <td>{it.nombreProducto}</td>
                          <td className="num">{it.cantidad}</td>
                          <td className="num">{fmtClp(it.precioUnitario)}</td>
                          <td className="num">{fmtClp(it.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'right', fontWeight: 600 }}>Total</td>
                        <td className="num" style={{ fontWeight: 600 }}>{fmtClp(ventaSeleccionada.montoTotal)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </>
          ) : error ? (
            <div className="ds-sm" style={{ color: 'var(--color-danger)', textAlign: 'center', padding: 32 }}>No se pudieron cargar las transacciones.</div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Fecha/Hora</th>
                  {sucursalId === 'all' && <th>Sucursal</th>}
                  <th>Canal</th>
                  <th style={{ textAlign: 'right' }}>Monto</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [0, 1, 2, 3, 4].map(i => (
                    <tr key={i}>
                      <td colSpan={colSpanLista}><div style={{ height: 14, background: 'var(--bg-surface-3)', borderRadius: 4, opacity: 0.5 }} /></td>
                    </tr>
                  ))
                ) : ventas.map(v => (
                  <tr key={v.id} style={{ cursor: 'pointer' }} onClick={() => abrirBoleta(v.id)}>
                    <td>{fmtFechaHora(v.fechaHora)}</td>
                    {sucursalId === 'all' && <td>{sucMap[v.sucursalRefId] ?? `#${v.sucursalRefId}`}</td>}
                    <td style={{ color: 'var(--text-secondary)' }}>{v.canal}</td>
                    <td className="num">{fmtClp(v.montoTotal)}</td>
                    <td style={{ textAlign: 'right' }}><Icon name="chevron-right" size={14} style={{ color: 'var(--text-secondary)' }} /></td>
                  </tr>
                ))}
                {!loading && ventas.length === 0 && (
                  <tr><td colSpan={colSpanLista} style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)' }}>Sin transacciones en el período seleccionado</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {!viendoBoleta && totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderTop: '1px solid var(--bg-border)' }}>
            <span className="ds-label" style={{ fontSize: 11 }}>{totalElements.toLocaleString('es-CL')} transacciones · página {page + 1} de {totalPages}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-ghost btn-sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Anterior</button>
              <button className="btn btn-ghost btn-sm" disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)}>Siguiente</button>
            </div>
          </div>
        )}
      </div>
    </ModalOverlay>
  );
}
