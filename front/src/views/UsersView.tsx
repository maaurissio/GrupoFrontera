import { useState, useEffect, useCallback, useRef } from 'react';
import { Icon } from '../components/Icon';
import { Badge, Panel, ColorAvatar, ModalOverlay } from '../components/Primitives';
import { DATA } from '../data';
import { listarUsuarios, crearUsuario, actualizarUsuario, desactivarUsuario, activarUsuario, listarSucursalesUsuario, asignarSucursal, desasignarSucursal } from '../api/usuarios';
import { listarSucursales } from '../api/sucursales';
import type { UsuarioDTO, SucursalDTO, AsignacionSucursalDTO } from '../api/types';
import { ApiError } from '../api/types';
import { validarRut, formatearRut } from '../utils/rut';
import { useDebounce } from '../hooks/useDebounce';
import { useAuth } from '../context/AuthContext';

function pwStrength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (pw.length === 0) return { level: 0, label: '', kind: 'neutral' };
  if (s <= 1) return { level: 1, label: 'Débil',  kind: 'danger' };
  if (s <= 3) return { level: 2, label: 'Media',  kind: 'warning' };
  return { level: 3, label: 'Fuerte', kind: 'success' };
}

function initials(nombre: string, apellido: string) {
  return ((nombre[0] ?? '') + (apellido[0] ?? '')).toUpperCase();
}

function RolesCell({ roles }: { roles: string[] }) {
  const shown = roles.slice(0, 2), rest = roles.length - 2;
  return (
    <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
      {shown.map(r => { const m = DATA.roleMeta[r] || { label: r, kind: 'neutral' }; return <Badge key={r} kind={m.kind} dot={false}>{m.label}</Badge>; })}
      {rest > 0 && <span className="ds-label" style={{ fontSize: 11 }}>+{rest} más</span>}
    </span>
  );
}

function BranchesCell({ branches }: { branches: string[] }) {
  const shown = branches.slice(0, 2), rest = branches.length - 2;
  return (
    <span style={{ color: 'var(--text-secondary)' }} title={branches.join(', ')}>
      {shown.length > 0 ? shown.join(', ') : '—'}
      {rest > 0 && <span className="ds-label" style={{ fontSize: 11, marginLeft: 4 }}>+{rest}</span>}
    </span>
  );
}

interface FieldError { rut?: string; email?: string; general?: string }

function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [rut, setRut] = useState('');
  const [dv, setDv] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldError>({});
  const st = pwStrength(pw);

  async function handleSubmit() {
    const errs: FieldError = {};
    if (!rut || !dv) { errs.rut = 'El RUT es obligatorio.'; }
    else if (rut.length > 9) { errs.rut = 'El RUT no puede tener más de 9 dígitos.'; }
    else if (!/^[0-9K]$/.test(dv)) { errs.rut = 'El dígito verificador debe ser un número (0-9) o la letra K.'; }
    else if (!validarRut(rut, dv)) { errs.rut = 'El dígito verificador del RUT no es válido.'; }
    if (!nombre.trim() || !apellido.trim()) { errs.general = 'Nombre y apellido son obligatorios.'; }
    if (!email.includes('@')) { errs.email = 'Ingresa un email válido.'; }
    if (pw.length < 8) { errs.general = 'La contraseña debe tener al menos 8 caracteres.'; }
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setErrors({});
    setLoading(true);
    try {
      await crearUsuario({ rut, dv, nombre, apellido, email, password: pw });
      onCreated();
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const msg = err.message.toLowerCase();
        if (msg.includes('rut')) setErrors({ rut: 'El RUT ya está registrado.' });
        else if (msg.includes('email')) setErrors({ email: 'El email ya está registrado.' });
        else setErrors({ general: 'El usuario ya existe. Verifica RUT y email.' });
      } else {
        setErrors({ general: 'Ha ocurrido un error inesperado. Intente más tarde.' });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="card ds-scroll" style={{ width: 520, maxHeight: '86vh', overflowY: 'auto', padding: 24, boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 className="ds-h2" style={{ margin: 0 }}>Nuevo usuario</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><Icon name="x" size={16} /></button>
        </div>

        {errors.general && (
          <div role="alert" style={{ background: 'rgba(239,68,68,.1)', border: '1px solid var(--color-danger)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="alert-circle" size={15} />{errors.general}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
          <div className="field">
            <label className="field-label">RUT (sin puntos ni guión, máx. 9 dígitos) *</label>
            <input className="input" placeholder="15482991" maxLength={9} value={rut} onChange={e => setRut(e.target.value.replace(/\D/g, '').slice(0, 9))} />
            {errors.rut && <span style={{ fontSize: 12, color: 'var(--color-danger)', marginTop: 4, display: 'block' }}>{errors.rut}</span>}
          </div>
          <div className="field">
            <label className="field-label">DV *</label>
            <input className="input" placeholder="2 o K" maxLength={1} value={dv} onChange={e => setDv(e.target.value.replace(/[^0-9kK]/g, '').toUpperCase().slice(0, 1))} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
          <div className="field"><label className="field-label">Nombre *</label><input className="input" value={nombre} onChange={e => setNombre(e.target.value)} /></div>
          <div className="field"><label className="field-label">Apellido *</label><input className="input" value={apellido} onChange={e => setApellido(e.target.value)} /></div>
        </div>

        <div className="field" style={{ marginTop: 14 }}>
          <label className="field-label">Email *</label>
          <input className="input" type="email" placeholder="nombre@cordillera.cl" value={email} onChange={e => setEmail(e.target.value)} />
          {errors.email && <span style={{ fontSize: 12, color: 'var(--color-danger)', marginTop: 4, display: 'block' }}>{errors.email}</span>}
        </div>

        <div className="field" style={{ marginTop: 14 }}>
          <label className="field-label">Contraseña * (mín. 8 caracteres)</label>
          <div className="search-wrap">
            <input className="input" type={showPw ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)} style={{ paddingRight: 36 }} />
            <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={showPw ? 'eye-off' : 'eye'} size={15} />
            </button>
          </div>
          {pw.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                {[1, 2, 3].map(i => <div key={i} style={{ flex: 1, height: 4, borderRadius: 999, background: i <= st.level ? 'var(--color-' + st.kind + ')' : 'var(--bg-surface-3)' }} />)}
              </div>
              <span className="ds-label" style={{ fontSize: 11, color: 'var(--color-' + st.kind + ')' }}>{st.label}</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22 }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {loading ? <><Icon name="loader" size={16} />Creando…</> : <><Icon name="check-circle-2" size={16} />Crear usuario</>}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

function EditUserModal({ user, onClose, onUpdated }: { user: UsuarioDTO; onClose: () => void; onUpdated: (u: UsuarioDTO) => void }) {
  const [nombre, setNombre] = useState(user.nombre);
  const [apellido, setApellido] = useState(user.apellido);
  const [email, setEmail] = useState(user.email);
  const [telefono, setTelefono] = useState(user.telefono ?? '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldError>({});

  async function handleSubmit() {
    const errs: FieldError = {};
    if (!nombre.trim() || !apellido.trim()) { errs.general = 'Nombre y apellido son obligatorios.'; }
    if (!email.includes('@')) { errs.email = 'Ingresa un email válido.'; }
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setErrors({});
    setLoading(true);
    try {
      const updated = await actualizarUsuario(user.id, {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        email: email.trim(),
        telefono: telefono.trim() || undefined,
      });
      onUpdated(updated);
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setErrors({ email: 'El email ya está registrado por otro usuario.' });
      } else {
        setErrors({ general: 'Ha ocurrido un error inesperado. Intente más tarde.' });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="card" style={{ width: 480, padding: 24, boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 className="ds-h2" style={{ margin: 0 }}>Editar usuario</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><Icon name="x" size={16} /></button>
        </div>

        {errors.general && (
          <div role="alert" style={{ background: 'rgba(239,68,68,.1)', border: '1px solid var(--color-danger)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="alert-circle" size={15} />{errors.general}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="field"><label className="field-label">Nombre *</label><input className="input" value={nombre} onChange={e => setNombre(e.target.value)} /></div>
          <div className="field"><label className="field-label">Apellido *</label><input className="input" value={apellido} onChange={e => setApellido(e.target.value)} /></div>
        </div>

        <div className="field" style={{ marginTop: 14 }}>
          <label className="field-label">Email *</label>
          <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          {errors.email && <span style={{ fontSize: 12, color: 'var(--color-danger)', marginTop: 4, display: 'block' }}>{errors.email}</span>}
        </div>

        <div className="field" style={{ marginTop: 14 }}>
          <label className="field-label">Teléfono</label>
          <input className="input" value={telefono} onChange={e => setTelefono(e.target.value)} />
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22 }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {loading ? <><Icon name="loader" size={16} />Guardando…</> : <><Icon name="check-circle-2" size={16} />Guardar cambios</>}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

function ConfirmModal({ user, onClose, onConfirmed }: { user: UsuarioDTO; onClose: () => void; onConfirmed: (id: string) => void }) {
  const off = user.estado === 'ACTIVO';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      if (off) await desactivarUsuario(user.id);
      else await activarUsuario(user.id);
      onConfirmed(user.id);
      onClose();
    } catch {
      setError('Ha ocurrido un error. Intente más tarde.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="card" style={{ width: 400, padding: 24, boxShadow: 'var(--shadow-lg)' }}>
        <h2 className="ds-h3" style={{ margin: '0 0 8px' }}>{off ? 'Desactivar usuario' : 'Activar usuario'}</h2>
        <p className="ds-sm" style={{ margin: '0 0 20px' }}>
          ¿Seguro que deseas {off ? 'desactivar' : 'activar'} a <b style={{ color: 'var(--text-primary)' }}>{user.nombre} {user.apellido}</b>?
        </p>
        {error && <div role="alert" style={{ fontSize: 13, color: 'var(--color-danger)', marginBottom: 14 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancelar</button>
          <button className={off ? 'btn btn-danger' : 'btn btn-primary'} onClick={handleConfirm} disabled={loading}>
            {loading ? 'Confirmando…' : 'Confirmar'}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

function AssignBranchesModal({ user, onClose, onChanged }: { user: UsuarioDTO; onClose: () => void; onChanged: () => void }) {
  const [sucursales, setSucursales] = useState<SucursalDTO[]>([]);
  const [asignadas, setAsignadas] = useState<AsignacionSucursalDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    const ac = new AbortController();
    (async () => {
      try {
        const [sucs, asigs] = await Promise.all([
          listarSucursales(ac.signal),
          listarSucursalesUsuario(user.id, ac.signal),
        ]);
        setSucursales(sucs);
        setAsignadas(asigs);
      } catch {
        if (!ac.signal.aborted) setError('No se pudieron cargar las sucursales.');
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();
    return () => { aliveRef.current = false; ac.abort(); };
  }, [user.id]);

  const asignacionDe = (sucId: number) => asignadas.find(a => a.sucursalId === sucId);

  async function toggle(suc: SucursalDTO) {
    if (busy != null) return;
    const ya = asignacionDe(suc.id);
    setBusy(suc.id);
    setError(null);
    try {
      if (ya) {
        await desasignarSucursal(ya.id);
        if (!aliveRef.current) return;
        setAsignadas(prev => prev.filter(a => a.sucursalId !== suc.id));
      } else {
        await asignarSucursal(user.id, suc.id);
        // Recarga para obtener el id de la nueva asignación (necesario para desasignar).
        const fresh = await listarSucursalesUsuario(user.id);
        if (!aliveRef.current) return;
        setAsignadas(fresh);
      }
      setDirty(true);
    } catch (err) {
      if (!aliveRef.current) return;
      if (err instanceof ApiError && err.status === 409) {
        // Estado desincronizado (p. ej. ya estaba asignada): resincroniza desde el servidor.
        setError('La asignación ya había cambiado; se actualizó la lista.');
        try { setAsignadas(await listarSucursalesUsuario(user.id)); } catch { /* ignore */ }
        setDirty(true);
      } else {
        setError('No se pudo actualizar la asignación. Intenta nuevamente.');
      }
    } finally {
      if (aliveRef.current) setBusy(null);
    }
  }

  function handleClose() {
    if (dirty) onChanged();
    onClose();
  }

  return (
    <ModalOverlay onClose={handleClose}>
      <div className="card" style={{ width: 460, padding: 24, boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <h2 className="ds-h2" style={{ margin: 0 }}>Asignar sucursales</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={handleClose}><Icon name="x" size={16} /></button>
        </div>
        <p className="ds-sm" style={{ margin: '0 0 16px', color: 'var(--text-secondary)' }}>
          Sucursales de <b style={{ color: 'var(--text-primary)' }}>{user.nombre} {user.apellido}</b>
        </p>

        {error && <div role="alert" style={{ fontSize: 13, color: 'var(--color-danger)', marginBottom: 12 }}>{error}</div>}

        {loading ? (
          <div style={{ padding: 28, textAlign: 'center' }}>
            <Icon name="loader" size={18} style={{ color: 'var(--text-disabled)' }} />
          </div>
        ) : sucursales.length === 0 ? (
          <div className="ds-sm" style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>No hay sucursales disponibles.</div>
        ) : (
          <div className="ds-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 360, overflowY: 'auto' }}>
            {sucursales.map(s => {
              const ya = asignacionDe(s.id);
              const enProceso = busy === s.id;
              return (
                <button key={s.id} onClick={() => toggle(s)} disabled={busy != null}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', width: '100%',
                    padding: '10px 12px', borderRadius: 10, cursor: busy != null ? 'default' : 'pointer',
                    background: ya ? 'var(--bg-surface-3)' : 'var(--bg-surface-1)',
                    border: '1px solid ' + (ya ? 'var(--color-info)' : 'var(--bg-border)'),
                  }}>
                  <span style={{
                    width: 20, height: 20, flex: 'none', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: ya ? 'var(--color-info)' : 'transparent',
                    border: '1px solid ' + (ya ? 'var(--color-info)' : 'var(--bg-border-strong)'),
                    color: '#fff',
                  }}>
                    {ya && <Icon name="check" size={13} />}
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="ds-sm" style={{ color: 'var(--text-primary)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.nombre}</div>
                    <div className="ds-label" style={{ fontSize: 11 }}>{s.ciudad}{s.codigo ? ` · ${s.codigo}` : ''}{!s.habilitada ? ' · inactiva' : ''}</div>
                  </div>
                  {enProceso
                    ? <Icon name="loader" size={14} style={{ color: 'var(--text-disabled)' }} />
                    : <span className="ds-label" style={{ fontSize: 11, color: ya ? 'var(--color-info)' : 'var(--text-secondary)' }}>{ya ? 'Asignada' : 'Asignar'}</span>}
                </button>
              );
            })}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
          <button className="btn btn-primary" onClick={handleClose}>Listo</button>
        </div>
      </div>
    </ModalOverlay>
  );
}

function UserDetailModal({ user, onClose }: { user: UsuarioDTO; onClose: () => void }) {
  const em = DATA.estadoMeta[user.estado] ?? { kind: 'neutral' };
  const rutDisplay = formatearRut(user.rut, user.dv);
  return (
    <ModalOverlay onClose={onClose}>
      <div className="card" style={{ width: 480, padding: 24, boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 className="ds-h2" style={{ margin: 0 }}>Detalle de usuario</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><Icon name="x" size={16} /></button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <ColorAvatar name={`${user.nombre} ${user.apellido}`} initials={initials(user.nombre, user.apellido)} size={48} />
          <div>
            <div className="ds-h3" style={{ fontSize: 18 }}>{user.nombre} {user.apellido}</div>
            <div className="ds-sm" style={{ color: 'var(--text-secondary)' }}>{user.email}</div>
          </div>
          <div style={{ marginLeft: 'auto' }}><Badge kind={em.kind} dot={user.estado !== 'INACTIVO'}>{user.estado}</Badge></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: '16px 0', borderTop: '1px solid var(--bg-border)' }}>
          <div><div className="ds-label" style={{ fontSize: 10, marginBottom: 4 }}>RUT</div><div className="ds-mono" style={{ color: 'var(--text-primary)' }}>{rutDisplay}</div></div>
          <div><div className="ds-label" style={{ fontSize: 10, marginBottom: 4 }}>Estado</div><div className="ds-sm" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{user.estado}</div></div>
          <div style={{ gridColumn: '1 / -1' }}>
            <div className="ds-label" style={{ fontSize: 10, marginBottom: 6 }}>Roles asignados</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {user.roles.length > 0 ? user.roles.map(r => { const m = DATA.roleMeta[r] || { label: r, kind: 'neutral' }; return <Badge key={r} kind={m.kind} dot={false}>{m.label}</Badge>; }) : <span className="ds-label">Sin roles asignados</span>}
            </div>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <div className="ds-label" style={{ fontSize: 10, marginBottom: 6 }}>Sucursales asignadas</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {user.sucursales.length > 0 ? user.sucursales.map(b => (
                <span key={b} style={{ padding: '5px 10px', borderRadius: 999, fontSize: 12, fontFamily: 'var(--font-sans)', background: 'var(--bg-surface-1)', border: '1px solid var(--bg-border)', color: 'var(--text-primary)' }}>{b}</span>
              )) : <span className="ds-label">Sin sucursales asignadas</span>}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
          <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </ModalOverlay>
  );
}

export function UsersView() {
  const { usuario: usuarioActual } = useAuth();
  const [usuarios, setUsuarios] = useState<UsuarioDTO[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'ok'>('loading');
  const [soloActivos, setSoloActivos] = useState(true);
  const [q, setQ] = useState('');
  const debouncedQ = useDebounce(q);
  const [create, setCreate] = useState(false);
  const [confirm, setConfirm] = useState<UsuarioDTO | null>(null);
  const [detail, setDetail] = useState<UsuarioDTO | null>(null);
  const [assign, setAssign] = useState<UsuarioDTO | null>(null);
  const [edit, setEdit] = useState<UsuarioDTO | null>(null);

  const fetchUsuarios = useCallback(async () => {
    setStatus('loading');
    const ac = new AbortController();
    try {
      const data = await listarUsuarios(ac.signal);
      setUsuarios(data);
      setStatus('ok');
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setStatus('error');
    }
  }, []);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  const displayUsuarios = usuarios
    .filter(u => !soloActivos || u.estado === 'ACTIVO')
    .filter(u => {
      const name = `${u.nombre} ${u.apellido}`.toLowerCase();
      return name.includes(debouncedQ.toLowerCase()) || u.email.toLowerCase().includes(debouncedQ.toLowerCase());
    });

  function handleConfirmed(id: string) {
    setUsuarios(prev => prev.map(u => {
      if (u.id !== id) return u;
      return { ...u, estado: u.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO' };
    }));
  }

  function handleUpdated(updated: UsuarioDTO) {
    setUsuarios(prev => prev.map(u => (u.id === updated.id ? { ...u, ...updated } : u)));
  }

  return (
    <div style={{ position: 'relative' }}>
      <Panel style={{ padding: 0 }} bodyStyle={{ padding: 0 }} title="Usuarios del sistema"
        action={
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              className={soloActivos ? 'btn btn-secondary btn-sm' : 'btn btn-ghost btn-sm'}
              style={{ height: 32, fontSize: 12 }}
              onClick={() => setSoloActivos(!soloActivos)}
            >
              {soloActivos ? 'Solo activos' : 'Ver todos'}
            </button>
            <div className="search-wrap" style={{ width: 200 }}>
              <Icon name="search" size={15} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-disabled)', pointerEvents: 'none' }} />
              <input className="input input-search" placeholder="Buscar por nombre…" value={q} onChange={e => setQ(e.target.value)} style={{ height: 32 }} />
            </div>
            <button className="btn btn-primary btn-sm" style={{ height: 32, display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => setCreate(true)}>
              <Icon name="plus" size={14} />Nuevo usuario
            </button>
          </div>
        }>

        {status === 'loading' ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <Icon name="loader" size={20} style={{ color: 'var(--text-disabled)' }} />
            <div className="ds-sm" style={{ marginTop: 8, color: 'var(--text-secondary)' }}>Cargando usuarios…</div>
          </div>
        ) : status === 'error' ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div role="alert">
              <Icon name="alert-circle" size={22} style={{ color: 'var(--color-danger)' }} />
              <div className="ds-sm" style={{ marginTop: 8 }}>Ha ocurrido un error inesperado. Intente más tarde.</div>
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={fetchUsuarios}>Reintentar</button>
            </div>
          </div>
        ) : (
          <>
            <table className="tbl">
              <thead>
                <tr><th>RUT</th><th>Nombre</th><th>Email</th><th>Roles</th><th>Sucursales</th><th>Estado</th><th /></tr>
              </thead>
              <tbody>
                {displayUsuarios.map(u => {
                  const off = u.estado === 'ACTIVO';
                  const em = DATA.estadoMeta[u.estado] ?? { kind: 'neutral' };
                  const rutDisplay = formatearRut(u.rut, u.dv);
                  const esYoMismo = usuarioActual?.id === u.id;
                  const bloquearAutodesactivar = esYoMismo && off;
                  return (
                    <tr key={u.id}>
                      <td className="ds-mono" style={{ color: 'var(--text-secondary)' }}>{rutDisplay}</td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
                          <ColorAvatar name={`${u.nombre} ${u.apellido}`} initials={initials(u.nombre, u.apellido)} size={28} />
                          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{u.nombre} {u.apellido}</span>
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td><RolesCell roles={u.roles} /></td>
                      <td><BranchesCell branches={u.sucursales} /></td>
                      <td><Badge kind={em.kind} dot={u.estado !== 'INACTIVO'}>{u.estado}</Badge></td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 4 }}>
                          <button className="btn btn-ghost btn-icon btn-sm" aria-label={`Editar a ${u.nombre} ${u.apellido}`} title="Editar" onClick={() => setEdit(u)}><Icon name="pencil" size={14} /></button>
                          <button className="btn btn-ghost btn-icon btn-sm" aria-label={`Asignar sucursales a ${u.nombre} ${u.apellido}`} title="Asignar sucursales" onClick={() => setAssign(u)}><Icon name="store" size={14} /></button>
                          <button className="btn btn-ghost btn-icon btn-sm" aria-label={`Ver detalle de ${u.nombre} ${u.apellido}`} title="Ver detalle" onClick={() => setDetail(u)}><Icon name="eye" size={14} /></button>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{
                              height: 28,
                              color: bloquearAutodesactivar ? 'var(--text-disabled)' : (off ? 'var(--color-danger)' : 'var(--color-success)'),
                              cursor: bloquearAutodesactivar ? 'not-allowed' : undefined,
                            }}
                            disabled={bloquearAutodesactivar}
                            title={bloquearAutodesactivar ? 'No puedes desactivar tu propia cuenta' : undefined}
                            onClick={() => { if (bloquearAutodesactivar) return; setConfirm(u); }}
                          >{off ? 'Desactivar' : 'Activar'}</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {displayUsuarios.length === 0 && (
              <div style={{ padding: '40px 16px', textAlign: 'center' }}>
                <Icon name="users" size={22} style={{ color: 'var(--text-disabled)' }} />
                <div className="ds-sm" style={{ marginTop: 8 }}>
                  {q ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
                </div>
                {!q && (
                  <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => setCreate(true)}>
                    <Icon name="plus" size={14} />Crear usuario
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </Panel>
      {create && <CreateUserModal onClose={() => setCreate(false)} onCreated={fetchUsuarios} />}
      {confirm && <ConfirmModal user={confirm} onClose={() => setConfirm(null)} onConfirmed={handleConfirmed} />}
      {detail && <UserDetailModal user={detail} onClose={() => setDetail(null)} />}
      {assign && <AssignBranchesModal user={assign} onClose={() => setAssign(null)} onChanged={fetchUsuarios} />}
      {edit && <EditUserModal user={edit} onClose={() => setEdit(null)} onUpdated={handleUpdated} />}
    </div>
  );
}
