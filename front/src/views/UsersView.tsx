import { useState } from 'react';
import { Icon } from '../components/Icon';
import { Badge, Panel, ColorAvatar, ModalOverlay } from '../components/Primitives';
import { DATA } from '../data';

type Usuario = typeof DATA.usuarios[0];

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
      {shown.join(', ')}{rest > 0 && <span className="ds-label" style={{ fontSize: 11, marginLeft: 4 }}>+{rest}</span>}
    </span>
  );
}

function CreateUserModal({ onClose }: { onClose: () => void }) {
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [sucs, setSucs] = useState<string[]>([]);
  const st = pwStrength(pw);
  const toggleSuc = (n: string) => setSucs(s => s.includes(n) ? s.filter(x => x !== n) : [...s, n]);
  return (
    <ModalOverlay onClose={onClose}>
      <div className="card ds-scroll" style={{ width: 520, maxHeight: '86vh', overflowY: 'auto', padding: 24, boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 className="ds-h2" style={{ margin: 0 }}>Nuevo usuario</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><Icon name="x" size={16} /></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
          <div className="field"><label className="field-label">RUT (sin puntos ni guión) *</label><input className="input" placeholder="15482991" /></div>
          <div className="field"><label className="field-label">DV *</label><input className="input" placeholder="2 o K" maxLength={1} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
          <div className="field"><label className="field-label">Nombre *</label><input className="input" /></div>
          <div className="field"><label className="field-label">Apellido *</label><input className="input" /></div>
        </div>
        <div className="field" style={{ marginTop: 14 }}><label className="field-label">Email *</label><input className="input" type="email" placeholder="nombre@cordillera.cl" /></div>
        <div className="field" style={{ marginTop: 14 }}>
          <label className="field-label">Password * (mín. 8 caracteres)</label>
          <div className="search-wrap">
            <input className="input" type={showPw ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)} style={{ paddingRight: 36 }} />
            <button onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
        <div className="field" style={{ marginTop: 14 }}>
          <label className="field-label">Sucursales (multiselect)</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {DATA.branches.map(b => {
              const on = sucs.includes(b.name);
              return <button key={b.name} onClick={() => toggleSuc(b.name)} style={{
                padding: '6px 11px', borderRadius: 999, fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-sans)',
                border: '1px solid ' + (on ? 'var(--link-fg)' : 'var(--bg-border)'),
                background: on ? 'var(--bg-surface-3)' : 'var(--bg-surface-1)', color: on ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}>{b.name}</button>;
            })}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="check-circle-2" size={16} />Crear usuario</button>
        </div>
      </div>
    </ModalOverlay>
  );
}

function ConfirmModal({ user, onClose }: { user: Usuario; onClose: () => void }) {
  const off = user.estado === 'ACTIVO';
  return (
    <ModalOverlay onClose={onClose}>
      <div className="card" style={{ width: 400, padding: 24, boxShadow: 'var(--shadow-lg)' }}>
        <h2 className="ds-h3" style={{ margin: '0 0 8px' }}>{off ? 'Desactivar usuario' : 'Activar usuario'}</h2>
        <p className="ds-sm" style={{ margin: '0 0 20px' }}>¿Seguro que deseas {off ? 'desactivar' : 'activar'} a <b style={{ color: 'var(--text-primary)' }}>{user.name}</b>?</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className={off ? 'btn btn-danger' : 'btn btn-primary'} onClick={onClose}>Confirmar</button>
        </div>
      </div>
    </ModalOverlay>
  );
}

function UserDetailModal({ user, onClose }: { user: Usuario; onClose: () => void }) {
  const em = DATA.estadoMeta[user.estado];
  return (
    <ModalOverlay onClose={onClose}>
      <div className="card" style={{ width: 480, padding: 24, boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 className="ds-h2" style={{ margin: 0 }}>Detalle de usuario</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><Icon name="x" size={16} /></button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <ColorAvatar name={user.name} initials={user.initials} size={48} />
          <div>
            <div className="ds-h3" style={{ fontSize: 18 }}>{user.name}</div>
            <div className="ds-sm" style={{ color: 'var(--text-secondary)' }}>{user.email}</div>
          </div>
          <div style={{ marginLeft: 'auto' }}><Badge kind={em.kind} dot={user.estado !== 'INACTIVO'}>{user.estado}</Badge></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: '16px 0', borderTop: '1px solid var(--bg-border)' }}>
          <div><div className="ds-label" style={{ fontSize: 10, marginBottom: 4 }}>RUT</div><div className="ds-mono" style={{ color: 'var(--text-primary)' }}>{user.rut}</div></div>
          <div><div className="ds-label" style={{ fontSize: 10, marginBottom: 4 }}>Estado</div><div className="ds-sm" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{user.estado}</div></div>
          <div style={{ gridColumn: '1 / -1' }}>
            <div className="ds-label" style={{ fontSize: 10, marginBottom: 6 }}>Roles asignados</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {user.roles.map(r => { const m = DATA.roleMeta[r] || { label: r, kind: 'neutral' }; return <Badge key={r} kind={m.kind} dot={false}>{m.label}</Badge>; })}
            </div>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <div className="ds-label" style={{ fontSize: 10, marginBottom: 6 }}>Sucursales asignadas</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {user.branches.map(b => (
                <span key={b} style={{ padding: '5px 10px', borderRadius: 999, fontSize: 12, fontFamily: 'var(--font-sans)', background: 'var(--bg-surface-1)', border: '1px solid var(--bg-border)', color: 'var(--text-primary)' }}>{b}</span>
              ))}
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
  const [q, setQ] = useState('');
  const [create, setCreate] = useState(false);
  const [confirm, setConfirm] = useState<Usuario | null>(null);
  const [detail, setDetail] = useState<Usuario | null>(null);
  const rows = DATA.usuarios.filter(u => u.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div style={{ position: 'relative' }}>
      <Panel style={{ padding: 0 }} bodyStyle={{ padding: 0 }} title="Usuarios del sistema"
        action={
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div className="search-wrap" style={{ width: 200 }}>
              <Icon name="search" size={15} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-disabled)', pointerEvents: 'none' }} />
              <input className="input input-search" placeholder="Buscar por nombre…" value={q} onChange={e => setQ(e.target.value)} style={{ height: 32 }} />
            </div>
            <button className="btn btn-primary btn-sm" style={{ height: 32, display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => setCreate(true)}>
              <Icon name="plus" size={14} />Nuevo usuario
            </button>
          </div>
        }>
        <table className="tbl">
          <thead>
            <tr><th>RUT</th><th>Nombre</th><th>Email</th><th>Roles</th><th>Sucursales</th><th>Estado</th><th /></tr>
          </thead>
          <tbody>
            {rows.map(u => {
              const off = u.estado === 'ACTIVO';
              const em = DATA.estadoMeta[u.estado];
              return (
                <tr key={u.rut}>
                  <td className="ds-mono" style={{ color: 'var(--text-secondary)' }}>{u.rut}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
                      <ColorAvatar name={u.name} initials={u.initials} size={28} />
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{u.name}</span>
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td><RolesCell roles={u.roles} /></td>
                  <td><BranchesCell branches={u.branches} /></td>
                  <td><Badge kind={em.kind} dot={u.estado !== 'INACTIVO'}>{u.estado}</Badge></td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-icon btn-sm" title="Ver detalle" onClick={() => setDetail(u)}><Icon name="eye" size={14} /></button>
                      <button className="btn btn-ghost btn-icon btn-sm" title="Editar"><Icon name="pencil" size={14} /></button>
                      <button className="btn btn-ghost btn-sm" style={{ height: 28, color: off ? 'var(--color-danger)' : 'var(--color-success)' }} onClick={() => setConfirm(u)}>{off ? 'Desactivar' : 'Activar'}</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div style={{ padding: '40px 16px', textAlign: 'center' }}>
            <Icon name="users" size={22} style={{ color: 'var(--text-disabled)' }} />
            <div className="ds-sm" style={{ marginTop: 8 }}>No se encontraron usuarios</div>
          </div>
        )}
      </Panel>
      {create && <CreateUserModal onClose={() => setCreate(false)} />}
      {confirm && <ConfirmModal user={confirm} onClose={() => setConfirm(null)} />}
      {detail && <UserDetailModal user={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
