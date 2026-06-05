import { useState, useEffect, useRef } from 'react';
import { Icon } from '../components/Icon';
import { Badge, ModalOverlay } from '../components/Primitives';
import { DATA } from '../data';

type Branch = typeof DATA.branches[0];

declare const maplibregl: any;

const MAP_STYLE = {
  version: 8,
  sources: {
    carto: {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap © CARTO',
    },
  },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': '#0F0F0F' } },
    { id: 'carto', type: 'raster', source: 'carto' },
  ],
};

function BranchMap({ branch }: { branch: Branch }) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const readyRef = useRef(false);

  useEffect(() => {
    if (!window.maplibregl && !mapRef.current) {
      import('maplibre-gl').then(ml => {
        (window as any).maplibregl = ml.default;
        init();
      });
    } else {
      init();
    }

    function init() {
      if (!maplibregl || !elRef.current) return;
      import('maplibre-gl/dist/maplibre-gl.css').catch(() => {});
      const map = new maplibregl.Map({
        container: elRef.current,
        style: MAP_STYLE,
        center: [branch.lng, branch.lat],
        zoom: 15.5,
        attributionControl: { compact: true },
      });
      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
      map.on('load', () => {
        map.addSource('branch', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({ id: 'branch-halo', type: 'circle', source: 'branch', paint: { 'circle-radius': 13, 'circle-color': '#3B82F6', 'circle-opacity': 0.18 } });
        map.addLayer({ id: 'branch-dot',  type: 'circle', source: 'branch', paint: { 'circle-radius': 6,  'circle-color': '#3B82F6', 'circle-stroke-color': '#0F0F0F', 'circle-stroke-width': 3 } });
        readyRef.current = true;
        paint(map);
      });
      return () => { map.remove(); readyRef.current = false; };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function paint(m?: any) {
    const map = m || mapRef.current;
    if (!map || !readyRef.current) return;
    const pt = { type: 'Feature', geometry: { type: 'Point', coordinates: [branch.lng, branch.lat] } };
    map.getSource('branch')?.setData({ type: 'FeatureCollection', features: [pt] });
  }

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    paint();
    map.flyTo({ center: [branch.lng, branch.lat], zoom: 15.5, speed: 1.4, essential: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branch.lng, branch.lat]);

  return <div ref={elRef} style={{ position: 'absolute', inset: 0 }} />;
}

function Meta({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="ds-label" style={{ fontSize: 10, marginBottom: 2 }}>{label}</div>
      <div className={mono ? 'ds-mono' : 'ds-sm'} style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{value}</div>
    </div>
  );
}

function BranchModal({ mode, data, onSave, onClose }: { mode: 'new' | 'edit'; data?: Partial<Branch>; onSave: (d: any) => void; onClose: () => void }) {
  const [f, setF] = useState(data || { name: '', city: 'Santiago', address: '', manager: '', lat: -33.4489, lng: -70.6693 });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <ModalOverlay onClose={onClose}>
      <div className="card" style={{ width: 460, padding: 24, boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 className="ds-h2" style={{ margin: 0 }}>{mode === 'new' ? 'Nueva sucursal' : 'Editar sucursal'}</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><Icon name="x" size={16} /></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="field" style={{ gridColumn: '1 / -1' }}><label className="field-label">Nombre</label><input className="input" value={f.name || ''} onChange={set('name')} placeholder="Sucursal…" /></div>
          <div className="field" style={{ gridColumn: '1 / -1' }}><label className="field-label">Dirección</label><input className="input" value={f.address || ''} onChange={set('address')} placeholder="Calle 123" /></div>
          <div className="field"><label className="field-label">Ciudad</label><input className="input" value={f.city || ''} onChange={set('city')} /></div>
          <div className="field"><label className="field-label">Jefe de sucursal</label><input className="input" value={f.manager || ''} onChange={set('manager')} placeholder="—" /></div>
          <div className="field"><label className="field-label">Latitud</label><input className="input" value={f.lat || 0} onChange={e => setF({ ...f, lat: parseFloat(e.target.value) || 0 })} /></div>
          <div className="field"><label className="field-label">Longitud</label><input className="input" value={f.lng || 0} onChange={e => setF({ ...f, lng: parseFloat(e.target.value) || 0 })} /></div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={() => onSave(f)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="check-circle-2" size={16} />{mode === 'new' ? 'Crear sucursal' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

export function BranchesView() {
  const [branches, setBranches] = useState(() => DATA.branches.map(b => ({ ...b })));
  const [sel, setSel] = useState(0);
  const [modal, setModal] = useState<{ mode: 'new' | 'edit'; data?: Partial<Branch> } | null>(null);
  const b = branches[Math.min(sel, branches.length - 1)] || branches[0];

  function save(data: any) {
    if (modal?.mode === 'new') {
      const next = [...branches, { ...data, sales: '—', delta: '', dir: 'flat' as const, stock: 'OK', stockKind: 'ok' as const, service: 'Operativo', serviceKind: 'success' as const, tx: 0, ticket: '—', meta: 0, opened: new Date().getFullYear().toString() }];
      setBranches(next); setSel(next.length - 1);
    } else {
      setBranches(branches.map((x, i) => (i === sel ? { ...x, ...data } : x)));
    }
    setModal(null);
  }

  function remove(i: number) {
    if (!confirm('¿Eliminar la sucursal ' + branches[i].name + '?')) return;
    const next = branches.filter((_, idx) => idx !== i);
    setBranches(next); setSel(Math.max(0, Math.min(sel, next.length - 1)));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {[
          { label: 'Sucursales activas',   value: branches.length,                                  icon: 'store',          accent: 'info' },
          { label: 'Ciudades',             value: new Set(branches.map(x => x.city)).size,          icon: 'map-pin',        accent: 'orange' },
          { label: 'Con alertas de stock', value: branches.filter(x => x.stockKind !== 'ok').length, icon: 'alert-triangle', accent: 'warning' },
        ].map(c => (
          <div key={c.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px' }}>
            <span className="kpi-ico" style={{ width: 40, height: 40, color: 'var(--color-' + c.accent + ')' }}><Icon name={c.icon} size={20} /></span>
            <div>
              <div className="kpi-label">{c.label}</div>
              <div className="ds-kpi" style={{ fontSize: 26, marginTop: 2 }}>{c.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 16, alignItems: 'stretch' }}>
        {/* list */}
        <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: 560 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--bg-border)' }}>
            <span className="ds-h3">Sucursales</span>
            <button className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => setModal({ mode: 'new' })}>
              <Icon name="plus" size={14} />Nueva
            </button>
          </div>
          <div className="ds-scroll" style={{ overflowY: 'auto', flex: 1 }}>
            {branches.map((x, i) => {
              const on = i === sel;
              return (
                <button key={x.name + i} onClick={() => setSel(i)} style={{
                  width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', border: 'none', borderBottom: '1px solid var(--bg-border)', cursor: 'pointer',
                  borderLeft: '2px solid ' + (on ? 'var(--color-info)' : 'transparent'),
                  background: on ? 'var(--bg-surface-3)' : 'transparent',
                }}
                  onMouseEnter={e => { if (!on) (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface-1)'; }}
                  onMouseLeave={e => { if (!on) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', flex: 'none', background: 'var(--color-' + x.serviceKind + ')' }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="ds-sm" style={{ color: 'var(--text-primary)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{x.name}</div>
                    <div className="ds-label" style={{ fontSize: 11 }}>{x.city} · {x.address}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* map */}
        <div className="card" style={{ padding: 0, position: 'relative', height: 560, overflow: 'hidden' }}>
          <BranchMap branch={b} />
          <div style={{ position: 'absolute', top: 16, left: 16, width: 280, background: 'rgba(26,26,26,0.92)', backdropFilter: 'blur(8px)', border: '1px solid var(--bg-border-strong)', borderRadius: 12, padding: 16, boxShadow: 'var(--shadow-pop)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <div>
                <div className="ds-h3" style={{ fontSize: 16 }}>{b.name}</div>
                <div className="ds-label" style={{ fontSize: 11, marginTop: 2 }}>{b.address}</div>
              </div>
              <Badge kind={b.serviceKind}>{b.service}</Badge>
            </div>
            <div style={{ height: 1, background: 'var(--bg-border)', margin: '14px 0' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Meta label="Ciudad" value={b.city} />
              <Meta label="Apertura" value={b.opened || '—'} mono />
              <Meta label="Jefe" value={b.manager || '—'} />
              <Meta label="Ventas del día" value={b.sales} mono />
              <Meta label="Stock" value={b.stock} mono />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => setModal({ mode: 'edit', data: { ...b } })}>
                <Icon name="pencil" size={14} />Editar
              </button>
              <button className="btn btn-secondary btn-icon btn-sm" title="Eliminar" onClick={() => remove(sel)} style={{ color: 'var(--color-danger)' }}>
                <Icon name="trash-2" size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {modal && <BranchModal mode={modal.mode} data={modal.data} onSave={save} onClose={() => setModal(null)} />}
    </div>
  );
}
