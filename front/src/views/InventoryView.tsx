import { useState } from 'react';
import { Icon } from '../components/Icon';
import { Badge, Panel, ModalOverlay } from '../components/Primitives';
import { DATA } from '../data';

type ProdKind = 'crit' | 'warn' | 'ok';
interface Prod { sku: string; name: string; cat: string; branch: string; pres: number; online: number; min: number; kind: ProdKind; }

function estadoDe(p: Prod) {
  const total = p.pres + p.online;
  if (total === 0) return { label: 'Sin stock',   kind: 'danger',  rank: 0 };
  if (total < p.min) return { label: 'Bajo mínimo', kind: 'warning', rank: 1 };
  return { label: 'OK', kind: 'success', rank: 2 };
}

function StockModal({ prod, onClose }: { prod: Prod & { est: ReturnType<typeof estadoDe> }; onClose: () => void }) {
  const [delta, setDelta] = useState('');
  const d = parseInt(delta, 10);
  const valid = !isNaN(d) && d !== 0;
  const total = prod.pres + prod.online;
  const result = valid ? total + d : total;
  const negative = result < 0;
  return (
    <ModalOverlay onClose={onClose}>
      <div className="card" style={{ width: 420, padding: 24, boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <h2 className="ds-h2" style={{ margin: 0 }}>Actualizar stock</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><Icon name="x" size={16} /></button>
        </div>
        <p className="ds-sm" style={{ margin: '0 0 18px' }}>{prod.name} · {prod.sku}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
          <div className="field"><label className="field-label">Stock actual</label><input className="input" value={total} readOnly style={{ color: 'var(--text-secondary)' }} /></div>
          <div className="field">
            <label className="field-label">Delta (+ ingreso / − salida)</label>
            <input className="input" value={delta} onChange={e => setDelta(e.target.value.replace(/[^\-0-9]/g, ''))} placeholder="0"
              style={{ borderColor: negative ? 'var(--color-danger)' : undefined, color: negative ? 'var(--color-danger)' : undefined }} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 8, background: 'var(--bg-surface-1)', border: '1px solid ' + (negative ? 'var(--danger-border)' : 'var(--bg-border)') }}>
          <span className="ds-sm">Stock resultante</span>
          <span className="ds-mono" style={{ fontSize: 18, fontWeight: 600, color: negative ? 'var(--color-danger)' : 'var(--text-white)' }}>{result}</span>
        </div>
        {negative && <p className="ds-sm" style={{ color: 'var(--color-danger)', margin: '10px 0 0', fontSize: 12 }}>El stock resultante sería negativo. Ingresa una cantidad válida.</p>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" disabled={!valid || negative} onClick={onClose} style={{ opacity: !valid || negative ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="check-circle-2" size={16} />Guardar
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

function AddProductModal({ onClose }: { onClose: () => void }) {
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [cat, setCat] = useState('Tecnología');
  const [branch, setBranch] = useState(DATA.branches[0].name);
  const [pres, setPres] = useState('');
  const [online, setOnline] = useState('');
  const [min, setMin] = useState('');
  const valid = sku.trim() && name.trim() && pres !== '' && min !== '';

  return (
    <ModalOverlay onClose={onClose}>
      <div className="card" style={{ width: 500, padding: 24, boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <h2 className="ds-h2" style={{ margin: 0 }}>Agregar producto</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><Icon name="x" size={16} /></button>
        </div>
        <p className="ds-sm" style={{ margin: '0 0 18px' }}>Ingresa los datos del nuevo producto al inventario</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14 }}>
          <div className="field"><label className="field-label">SKU *</label><input className="input" value={sku} onChange={e => setSku(e.target.value.toUpperCase())} placeholder="TEC-0000" style={{ fontFamily: 'var(--font-mono)' }} /></div>
          <div className="field"><label className="field-label">Nombre del producto *</label><input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Nombre descriptivo" /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
          <div className="field">
            <label className="field-label">Categoría</label>
            <select className="input select" value={cat} onChange={e => setCat(e.target.value)} style={{ height: 34 }}>
              {DATA.categorias.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="field-label">Sucursal</label>
            <select className="input select" value={branch} onChange={e => setBranch(e.target.value)} style={{ height: 34 }}>
              {DATA.branches.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginTop: 14 }}>
          <div className="field"><label className="field-label">Stock presencial *</label><input className="input" type="number" min={0} value={pres} onChange={e => setPres(e.target.value)} placeholder="0" /></div>
          <div className="field"><label className="field-label">Stock online</label><input className="input" type="number" min={0} value={online} onChange={e => setOnline(e.target.value)} placeholder="0" /></div>
          <div className="field"><label className="field-label">Stock mínimo *</label><input className="input" type="number" min={1} value={min} onChange={e => setMin(e.target.value)} placeholder="5" /></div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" disabled={!valid} onClick={onClose} style={{ opacity: valid ? 1 : 0.5, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="check-circle-2" size={16} />Agregar producto
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

export function InventoryView() {
  const [estado, setEstado] = useState('all');
  const [cat, setCat] = useState('all');
  const [sucursal, setSucursal] = useState('all');
  const [q, setQ] = useState('');
  const [modal, setModal] = useState<(Prod & { est: ReturnType<typeof estadoDe> }) | null>(null);
  const [addModal, setAddModal] = useState(false);

  let rows = DATA.inventario.map(p => ({ ...p, est: estadoDe(p) }));
  if (sucursal !== 'all') rows = rows.filter(p => p.branch === sucursal);
  if (cat !== 'all') rows = rows.filter(p => p.cat === cat);
  if (q) rows = rows.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase()));
  if (estado !== 'all') rows = rows.filter(p => ({ ok: 'OK', bajo: 'Bajo mínimo', sin: 'Sin stock' } as Record<string, string>)[estado] === p.est.label);
  rows.sort((a, b) => a.est.rank - b.est.rank);

  const alerts = DATA.inventario.map(p => ({ ...p, est: estadoDe(p) })).filter(p => p.est.kind !== 'success');
  const tabs = [{ id: 'all', label: 'Todos' }, { id: 'ok', label: 'OK' }, { id: 'bajo', label: 'Bajo mínimo' }, { id: 'sin', label: 'Sin stock' }];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 16, position: 'relative' }}>
      <Panel style={{ padding: 0, minWidth: 0, overflow: 'hidden' }} bodyStyle={{ padding: 0 }} title="Stock por producto"
        action={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select className="input select" value={sucursal} onChange={e => setSucursal(e.target.value)} style={{ height: 32, width: 'auto', paddingRight: 28 }}>
              <option value="all">Todas las sucursales</option>
              {DATA.branches.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
            </select>
            <select className="input select" value={cat} onChange={e => setCat(e.target.value)} style={{ height: 32, width: 'auto', paddingRight: 28 }}>
              <option value="all">Toda categoría</option>
              {DATA.categorias.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button className="btn btn-primary btn-sm" style={{ height: 32, display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => setAddModal(true)}>
              <Icon name="plus" size={14} />Agregar producto
            </button>
          </div>
        }>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--bg-border)' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setEstado(t.id)} style={{
                padding: '6px 11px', borderRadius: 7, fontSize: 12, fontWeight: 500, fontFamily: 'var(--font-sans)', cursor: 'pointer',
                border: '1px solid ' + (estado === t.id ? 'var(--bg-border-strong)' : 'transparent'),
                background: estado === t.id ? 'var(--bg-surface-3)' : 'transparent',
                color: estado === t.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}>{t.label}</button>
            ))}
          </div>
          <div className="search-wrap" style={{ marginLeft: 'auto', width: 200 }}>
            <Icon name="search" size={15} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-disabled)', pointerEvents: 'none' }} />
            <input className="input input-search" placeholder="Buscar nombre o SKU…" value={q} onChange={e => setQ(e.target.value)} style={{ height: 32 }} />
          </div>
        </div>
        <div style={{ overflowX: 'auto' }} className="ds-scroll">
          <table className="tbl" style={{ minWidth: 720 }}>
            <thead>
              <tr><th>SKU</th><th>Nombre</th><th>Categoría</th><th style={{ textAlign: 'right' }}>Presencial</th><th style={{ textAlign: 'right' }}>Online</th><th>Estado</th><th /></tr>
            </thead>
            <tbody>
              {rows.map(p => (
                <tr key={p.sku}>
                  <td className="ds-mono" style={{ color: 'var(--text-secondary)' }}>{p.sku}</td>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{p.name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{p.cat}</td>
                  <td className="num" style={{ color: p.pres === 0 ? 'var(--color-danger)' : 'var(--text-primary)' }}>{p.pres}</td>
                  <td className="num" style={{ color: 'var(--text-primary)' }}>{p.online}</td>
                  <td><Badge kind={p.est.kind}>{p.est.label}</Badge></td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-ghost btn-sm" style={{ height: 28, display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={() => setModal(p)}>
                      <Icon name="pencil" size={13} />Editar stock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <div style={{ padding: '40px 16px', textAlign: 'center' }}>
            <Icon name="package" size={22} style={{ color: 'var(--text-disabled)' }} />
            <div className="ds-sm" style={{ marginTop: 8 }}>No se encontraron productos</div>
          </div>
        )}
      </Panel>

      {/* alerts panel */}
      <div className="card" style={{ padding: 0, alignSelf: 'start' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--bg-border)' }}>
          <span className="ds-h3">Alertas <span style={{ color: 'var(--text-secondary)' }}>({alerts.length})</span></span>
          <Icon name="bell" size={15} style={{ color: 'var(--text-secondary)' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', padding: 12, gap: 10 }}>
          {alerts.length === 0 && (
            <div style={{ padding: '20px 8px', textAlign: 'center' }}>
              <Icon name="check-circle-2" size={20} style={{ color: 'var(--color-success)' }} />
              <div className="ds-sm" style={{ marginTop: 6 }}>Sin alertas activas</div>
            </div>
          )}
          {alerts.map(a => (
            <div key={a.sku} style={{
              padding: '11px 13px', borderRadius: 9,
              background: a.est.kind === 'danger' ? 'var(--danger-bg)' : 'var(--warning-bg)',
              border: '1px solid ' + (a.est.kind === 'danger' ? 'var(--danger-border)' : 'var(--warning-border)'),
            }}>
              <div className="ds-sm" style={{ color: a.est.kind === 'danger' ? '#f87171' : '#fbbf24', fontWeight: 600 }}>{a.name}</div>
              <div className="ds-label" style={{ fontSize: 11, marginTop: 3, color: a.est.kind === 'danger' ? '#d68d8d' : '#d6a04a' }}>
                {a.branch} · {a.pres + a.online} de mín. {a.min}
              </div>
            </div>
          ))}
        </div>
      </div>

      {modal && <StockModal prod={modal} onClose={() => setModal(null)} />}
      {addModal && <AddProductModal onClose={() => setAddModal(false)} />}
    </div>
  );
}
