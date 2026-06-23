import { useState, useEffect, useCallback } from 'react';
import { Icon } from '../components/Icon';
import { Panel, ModalOverlay } from '../components/Primitives';
import { listarRoles, crearRol } from '../api/roles';
import { NOMBRES_ROL } from '../api/types';
import type { RolDTO, RolCreatePayload, NombreRol } from '../api/types';

const NOMBRE_LABEL: Record<string, string> = Object.fromEntries(
  NOMBRES_ROL.map(r => [r.value, r.label]),
);

function nombreLabel(nombre: string): string {
  return NOMBRE_LABEL[nombre] ?? nombre;
}

interface FormState {
  nombre: NombreRol;
  descripcion: string;
}

const EMPTY_FORM: FormState = { nombre: 'VENDEDOR', descripcion: '' };

function NuevoRolModal({
  onClose, onCreated,
}: {
  onClose: () => void;
  onCreated: (r: RolDTO) => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function submit() {
    setSaving(true);
    setError(null);
    const payload: RolCreatePayload = {
      nombre: form.nombre,
      descripcion: form.descripcion.trim() === '' ? null : form.descripcion.trim(),
    };
    try {
      const created = await crearRol(payload);
      onCreated(created);
      onClose();
    } catch (err) {
      const status = (err as { status?: number }).status;
      setError(
        status === 409
          ? 'Ya existe un rol con ese nombre.'
          : 'No se pudo crear el rol. Revisa los datos e intenta nuevamente.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="card" style={{ width: 440, maxWidth: '92vw', padding: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: '1px solid var(--bg-border)' }}>
          <span className="ds-h3">Nuevo rol</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><Icon name="x" size={14} /></button>
        </div>
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field">
            <label className="field-label">Nombre</label>
            <select className="input select" value={form.nombre}
              onChange={e => set('nombre', e.target.value as NombreRol)} style={{ height: 34 }}>
              {NOMBRES_ROL.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="field-label">Descripción (opcional)</label>
            <input className="input" value={form.descripcion} onChange={e => set('descripcion', e.target.value)} style={{ height: 34 }} />
          </div>
          {error && (
            <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-danger)' }}>
              <Icon name="alert-circle" size={16} />
              <span className="ds-sm">{error}</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '14px 18px', borderTop: '1px solid var(--bg-border)' }}>
          <button className="btn btn-ghost btn-sm" style={{ height: 34 }} onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary btn-sm" style={{ height: 34, display: 'flex', alignItems: 'center', gap: 6 }} disabled={saving} onClick={submit}>
            {saving ? <><Icon name="loader" size={14} />Guardando…</> : <><Icon name="check" size={14} />Crear rol</>}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

export function RolesView() {
  const [roles, setRoles] = useState<RolDTO[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'ok'>('loading');
  const [showNuevo, setShowNuevo] = useState(false);

  const fetchRoles = useCallback(async () => {
    setStatus('loading');
    const ac = new AbortController();
    try {
      const data = await listarRoles(ac.signal);
      setRoles(data);
      setStatus('ok');
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setStatus('error');
    }
    return () => ac.abort();
  }, []);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  function onCreated(r: RolDTO) {
    setRoles(prev => [...prev, r]);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="card" style={{ display: 'flex', justifyContent: 'flex-end', padding: '14px 16px' }}>
        <button className="btn btn-primary btn-sm" style={{ height: 34, display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => setShowNuevo(true)}>
          <Icon name="plus" size={14} />Nuevo rol
        </button>
      </div>

      <Panel style={{ padding: 0 }} bodyStyle={{ padding: 0 }} title="Roles existentes"
        action={<span className="ds-label">{status === 'ok' ? `${roles.length} roles` : ''}</span>}>
        {status === 'loading' ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <Icon name="loader" size={20} style={{ color: 'var(--text-disabled)' }} />
            <div className="ds-sm" style={{ marginTop: 8, color: 'var(--text-secondary)' }}>Cargando roles…</div>
          </div>
        ) : status === 'error' ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div role="alert">
              <Icon name="alert-circle" size={22} style={{ color: 'var(--color-danger)' }} />
              <div className="ds-sm" style={{ marginTop: 8 }}>Ha ocurrido un error inesperado. Intente más tarde.</div>
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={fetchRoles}>Reintentar</button>
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Descripción</th>
                </tr>
              </thead>
              <tbody>
                {roles.map(r => (
                  <tr key={r.id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{nombreLabel(r.nombre)}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{r.descripcion || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {roles.length === 0 && (
              <div style={{ padding: '40px 16px', textAlign: 'center' }}>
                <Icon name="shield" size={22} style={{ color: 'var(--text-disabled)' }} />
                <div className="ds-sm" style={{ marginTop: 8 }}>No hay roles creados todavía</div>
              </div>
            )}
          </div>
        )}
      </Panel>

      {showNuevo && (
        <NuevoRolModal onClose={() => setShowNuevo(false)} onCreated={onCreated} />
      )}
    </div>
  );
}
