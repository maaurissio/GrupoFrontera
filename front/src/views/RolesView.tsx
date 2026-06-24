import { useState, useEffect, useCallback } from 'react';
import { Icon } from '../components/Icon';
import { Badge, Panel, ModalOverlay } from '../components/Primitives';
import { listarRoles, crearRol } from '../api/roles';
import { listarUsuarios } from '../api/usuarios';
import { NOMBRES_ROL } from '../api/types';
import type { RolDTO, RolCreatePayload, NombreRol, UsuarioDTO } from '../api/types';

const NOMBRE_LABEL: Record<string, string> = Object.fromEntries(
  NOMBRES_ROL.map(r => [r.value, r.label]),
);

function nombreLabel(nombre: string): string {
  return NOMBRE_LABEL[nombre] ?? nombre;
}

// Las 3 credenciales semilla del sistema (ms-users/import.sql) son las únicas con
// reglas de acceso reales implementadas en el front — ver utils/permisos.ts.
const ROLES_SISTEMA = ['ADMIN', 'SOPORTE', 'GERENTE'];

const MODULOS: { id: string; label: string }[] = [
  { id: 'dashboard',  label: 'Resumen' },
  { id: 'reportes',   label: 'Reportes' },
  { id: 'productos',  label: 'Productos' },
  { id: 'usuarios',   label: 'Usuarios' },
  { id: 'roles',      label: 'Roles' },
  { id: 'sucursales', label: 'Sucursales' },
];

type Nivel = 'sin-acceso' | 'lectura' | 'edicion' | 'total' | 'sin-definir';

const NIVEL_META: Record<Nivel, { label: string; color: string }> = {
  'sin-acceso':  { label: 'Sin acceso',  color: 'var(--bg-border-strong)' },
  lectura:       { label: 'Lectura',     color: '#9CA3AF' },
  edicion:       { label: 'Edición',     color: '#f5b942' },
  total:         { label: 'Total',       color: '#4ade80' },
  'sin-definir': { label: 'Sin definir', color: 'transparent' },
};

// Tier de acceso por módulo. Gerente = solo lectura; Soporte = edición; Admin = total.
// Usuarios y Roles quedan sin acceso para Gerente y Soporte sin excepción.
function nivelDeRol(nombreRol: string, moduloId: string): Nivel {
  const moduloSensible = moduloId === 'usuarios' || moduloId === 'roles';
  if (nombreRol === 'ADMIN') return 'total';
  if (nombreRol === 'SOPORTE') return moduloSensible ? 'sin-acceso' : 'edicion';
  if (nombreRol === 'GERENTE') return moduloSensible ? 'sin-acceso' : 'lectura';
  return 'sin-definir';
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
          <div className="ds-label" style={{ fontSize: 11, color: 'var(--text-disabled)', marginTop: -4 }}>
            Solo Admin, Soporte y Gerente tienen niveles de acceso configurados. Un rol nuevo no
            restringe ni habilita nada hasta que se agregue a la lógica de permisos del frontend.
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

function RoleDetailModal({ rol, usuariosCount, onClose }: {
  rol: RolDTO;
  usuariosCount: number;
  onClose: () => void;
}) {
  const esSistema = ROLES_SISTEMA.includes(rol.nombre);
  return (
    <ModalOverlay onClose={onClose}>
      <div className="card" style={{ width: 440, maxWidth: '92vw', padding: 24, boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <h2 className="ds-h2" style={{ margin: 0 }}>{nombreLabel(rol.nombre)}</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><Icon name="x" size={16} /></button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0 14px' }}>
          {esSistema
            ? <Badge kind="neutral"><Icon name="lock" size={9} style={{ marginRight: 3 }} />Sistema</Badge>
            : <Badge kind="info">Personalizado</Badge>}
          <span className="ds-label" style={{ fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Icon name="users" size={12} />{usuariosCount} usuario{usuariosCount === 1 ? '' : 's'}
          </span>
        </div>
        <p className="ds-sm" style={{ margin: '0 0 16px' }}>{rol.descripcion || 'Sin descripción.'}</p>
        {esSistema ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {MODULOS.map(m => {
              const nivel = nivelDeRol(rol.nombre, m.id);
              const meta = NIVEL_META[nivel];
              return (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--bg-border)' }}>
                  <span className="ds-sm" style={{ color: 'var(--text-primary)' }}>{m.label}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: meta.color }} />
                    <span className="ds-label" style={{ fontSize: 11 }}>{meta.label}</span>
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="ds-sm" style={{ color: 'var(--text-secondary)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <Icon name="info" size={14} style={{ marginTop: 2, flex: 'none' }} />
            <span>Este rol no tiene niveles de acceso configurados todavía — agrégalo en utils/permisos.ts para activarlo.</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </ModalOverlay>
  );
}

export function RolesView() {
  const [roles, setRoles] = useState<RolDTO[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioDTO[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'ok'>('loading');
  const [showNuevo, setShowNuevo] = useState(false);
  const [verRol, setVerRol] = useState<RolDTO | null>(null);
  const [q, setQ] = useState('');

  const fetchAll = useCallback(async () => {
    setStatus('loading');
    const ac = new AbortController();
    try {
      const [rolesData, usuariosData] = await Promise.all([
        listarRoles(ac.signal),
        listarUsuarios(ac.signal),
      ]);
      setRoles(rolesData);
      setUsuarios(usuariosData);
      setStatus('ok');
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setStatus('error');
    }
    return () => ac.abort();
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  function onCreated(r: RolDTO) {
    setRoles(prev => [...prev, r]);
  }

  function usuariosDelRol(nombre: string): number {
    return usuarios.filter(u => u.roles.includes(nombre)).length;
  }

  const rolesSistema = roles.filter(r => ROLES_SISTEMA.includes(r.nombre));
  const rolesPersonalizados = roles.filter(r => !ROLES_SISTEMA.includes(r.nombre));

  const term = q.trim().toLowerCase();
  const filtrados = !term ? roles : roles.filter(r =>
    nombreLabel(r.nombre).toLowerCase().includes(term) || (r.descripcion ?? '').toLowerCase().includes(term));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {[
          { label: 'Roles totales',        value: roles.length,               icon: 'shield', accent: 'info' },
          { label: 'Roles del sistema',    value: rolesSistema.length,        icon: 'lock',   accent: 'neutral' },
          { label: 'Roles personalizados', value: rolesPersonalizados.length, icon: 'key',    accent: 'warning' },
        ].map(k => (
          <div key={k.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px' }}>
            <span className="kpi-ico" style={{ width: 40, height: 40, color: 'var(--color-' + k.accent + ')' }}><Icon name={k.icon} size={20} /></span>
            <div>
              <div className="kpi-label">{k.label}</div>
              <div className="ds-kpi" style={{ fontSize: 26, marginTop: 2 }}>{status === 'ok' ? k.value : '—'}</div>
            </div>
          </div>
        ))}
      </div>

      <Panel style={{ padding: 0 }} bodyStyle={{ padding: 0 }} title="Roles del sistema"
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="search-wrap" style={{ width: 180 }}>
              <Icon name="search" size={14} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-disabled)', pointerEvents: 'none' }} />
              <input className="input input-search" placeholder="Buscar rol…" value={q} onChange={e => setQ(e.target.value)} style={{ height: 32 }} />
            </div>
            <button className="btn btn-primary btn-sm" style={{ height: 32, display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => setShowNuevo(true)}>
              <Icon name="plus" size={14} />Crear rol
            </button>
          </div>
        }>
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
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={fetchAll}>Reintentar</button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filtrados.map(r => {
                const esSistema = ROLES_SISTEMA.includes(r.nombre);
                const count = usuariosDelRol(r.nombre);
                return (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: '1px solid var(--bg-border)' }}>
                    <span className="kpi-ico" style={{ width: 36, height: 36, flex: 'none', color: esSistema ? 'var(--color-warning)' : 'var(--text-secondary)' }}>
                      <Icon name={esSistema ? 'shield' : 'shield-question'} size={18} />
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{nombreLabel(r.nombre)}</span>
                        {esSistema && <Badge kind="neutral"><Icon name="lock" size={9} style={{ marginRight: 3 }} />Sistema</Badge>}
                      </div>
                      <div className="ds-sm" style={{ marginTop: 2 }}>{r.descripcion || '—'}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, flex: 'none' }} title="Acceso por módulo">
                      {MODULOS.map(m => {
                        const nivel = nivelDeRol(r.nombre, m.id);
                        return (
                          <span key={m.id} title={`${m.label}: ${NIVEL_META[nivel].label}`}
                            style={{ width: 7, height: 18, borderRadius: 2, background: NIVEL_META[nivel].color, border: nivel === 'sin-definir' ? '1px dashed var(--bg-border-strong)' : 'none' }} />
                        );
                      })}
                    </div>
                    <div className="ds-label" style={{ fontSize: 11, flex: 'none', display: 'flex', alignItems: 'center', gap: 4, minWidth: 78 }}>
                      <Icon name="users" size={12} />{count} usuario{count === 1 ? '' : 's'}
                    </div>
                    <button className="btn btn-ghost btn-sm" style={{ height: 28, flex: 'none', display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => setVerRol(r)}>
                      <Icon name="eye" size={13} />Ver
                    </button>
                  </div>
                );
              })}
              {filtrados.length === 0 && (
                <div style={{ padding: '40px 16px', textAlign: 'center' }}>
                  <Icon name="shield" size={22} style={{ color: 'var(--text-disabled)' }} />
                  <div className="ds-sm" style={{ marginTop: 8 }}>No hay roles que coincidan con la búsqueda</div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 16, padding: '12px 18px', borderTop: '1px solid var(--bg-border)' }}>
              <span className="ds-label" style={{ fontSize: 11 }}>Acceso por módulo:</span>
              {(['sin-acceso', 'lectura', 'edicion', 'total'] as Nivel[]).map(n => (
                <span key={n} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: NIVEL_META[n].color }} />
                  <span className="ds-label" style={{ fontSize: 11 }}>{NIVEL_META[n].label}</span>
                </span>
              ))}
            </div>
          </>
        )}
      </Panel>

      {showNuevo && (
        <NuevoRolModal onClose={() => setShowNuevo(false)} onCreated={onCreated} />
      )}
      {verRol && (
        <RoleDetailModal rol={verRol} usuariosCount={usuariosDelRol(verRol.nombre)} onClose={() => setVerRol(null)} />
      )}
    </div>
  );
}
