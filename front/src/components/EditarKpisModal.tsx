import { useState } from 'react';
import { Icon } from './Icon';
import { ModalOverlay } from './Primitives';
import { actualizarKpis } from '../api/kpis';
import type { KpisUpdatePayload, RespuestaKpis } from '../api/types';

function fmtClp(n: number) { return '$' + Math.round(n).toLocaleString('es-CL'); }
function fmtNum(n: number) { return Math.round(n).toLocaleString('es-CL'); }

export function EditarKpisModal({
  sucursalId, sucursalNombre, periodo, kpiActual, onClose, onGuardado,
}: {
  sucursalId: number;
  sucursalNombre: string;
  periodo: string;
  kpiActual: RespuestaKpis | null;
  onClose: () => void;
  onGuardado: () => void;
}) {
  const [totalVentas, setTotalVentas] = useState(kpiActual ? String(Math.round(Number(kpiActual.totalVentas))) : '');
  const [transacciones, setTransacciones] = useState(kpiActual ? String(kpiActual.cantidadTransacciones) : '');
  const [meta, setMeta] = useState(kpiActual ? String(Math.round(Number(kpiActual.metaMensual))) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const payload: KpisUpdatePayload = { sucursalId, periodo };
      if (totalVentas.trim()) payload.totalVentas = Number(totalVentas.replace(/\D/g, ''));
      if (transacciones.trim()) payload.cantidadTransacciones = Number(transacciones.replace(/\D/g, ''));
      if (meta.trim()) payload.metaMensual = Number(meta.replace(/\D/g, ''));
      await actualizarKpis(payload);
      onGuardado();
      onClose();
    } catch {
      setError('No se pudieron guardar los cambios. Revisa los valores e intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  }

  const fieldStyle: React.CSSProperties = { height: 36, fontFamily: 'var(--font-mono)', textAlign: 'right' };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="card" style={{ width: 420, maxWidth: '95vw', padding: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: '1px solid var(--bg-border)' }}>
          <div>
            <div className="ds-h3">Editar KPIs</div>
            <div className="ds-label" style={{ fontSize: 11, marginTop: 2 }}>{sucursalNombre} · {periodo}</div>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><Icon name="x" size={14} /></button>
        </div>
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="ds-sm" style={{ color: 'var(--text-secondary)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <Icon name="info" size={14} style={{ marginTop: 2, flex: 'none' }} />
            <span>Deja vacío un campo para no modificarlo. El ticket promedio y el % de cumplimiento se recalculan automáticamente.</span>
          </div>
          {kpiActual && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { label: 'Ventas actuales', value: fmtClp(Number(kpiActual.totalVentas)) },
                { label: 'Transacciones', value: fmtNum(kpiActual.cantidadTransacciones) },
                { label: 'Meta actual', value: fmtClp(Number(kpiActual.metaMensual)) },
              ].map(s => (
                <div key={s.label} className="card" style={{ padding: '8px 10px', background: 'var(--bg-surface-3)' }}>
                  <div className="ds-label" style={{ fontSize: 10 }}>{s.label}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, marginTop: 2 }}>{s.value}</div>
                </div>
              ))}
            </div>
          )}
          <div className="field">
            <label className="field-label">Total ventas (CLP)</label>
            <input className="input" style={fieldStyle} placeholder="ej. 18500000" value={totalVentas}
              onChange={e => setTotalVentas(e.target.value)} />
          </div>
          <div className="field">
            <label className="field-label">Cantidad de transacciones</label>
            <input className="input" style={fieldStyle} placeholder="ej. 450" value={transacciones}
              onChange={e => setTransacciones(e.target.value)} />
          </div>
          <div className="field">
            <label className="field-label">Meta mensual (CLP)</label>
            <input className="input" style={fieldStyle} placeholder="ej. 20000000" value={meta}
              onChange={e => setMeta(e.target.value)} />
          </div>
          {error && (
            <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-danger)' }}>
              <Icon name="alert-circle" size={15} />
              <span className="ds-sm">{error}</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '14px 18px', borderTop: '1px solid var(--bg-border)' }}>
          <button className="btn btn-ghost btn-sm" style={{ height: 34 }} onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary btn-sm" style={{ height: 34, display: 'flex', alignItems: 'center', gap: 6 }} disabled={saving} onClick={submit}>
            {saving ? <><Icon name="loader" size={14} />Guardando…</> : <><Icon name="check" size={14} />Guardar cambios</>}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}
