import { useState, useEffect, useRef, useCallback } from 'react';
import { Icon } from '../components/Icon';
import { Badge, ModalOverlay } from '../components/Primitives';
import { listarSucursales, crearSucursal, actualizarSucursal, cambiarEstadoSucursal } from '../api/sucursales';
import type { SucursalDTO } from '../api/types';

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

const COORDS: Record<string, { lat: number; lng: number }> = {
  'Santiago Centro': { lat: -33.4489, lng: -70.6693 },
  'Providencia':     { lat: -33.4255, lng: -70.6110 },
  'Valparaíso':      { lat: -33.0458, lng: -71.6197 },
  'Viña del Mar':    { lat: -33.0245, lng: -71.5518 },
  'Concepción':      { lat: -36.8201, lng: -73.0444 },
  'Talcahuano':      { lat: -36.7249, lng: -73.1168 },
};

const DEFAULT_CENTER: [number, number] = [-70.6693, -33.4489];

function BranchMap({ lat, lng }: { lat: number; lng: number }) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const readyRef = useRef(false);

  useEffect(() => {
    if (!window.maplibregl && !mapRef.current) {
      import('maplibre-gl').then(ml => { (window as any).maplibregl = ml.default; init(); });
    } else { init(); }

    function init() {
      if (!maplibregl || !elRef.current) return;
      import('maplibre-gl/dist/maplibre-gl.css').catch(() => {});
      const map = new maplibregl.Map({
        container: elRef.current, style: MAP_STYLE,
        center: [lng, lat], zoom: 15.5,
        attributionControl: { compact: true },
      });
      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
      map.on('load', () => {
        map.addSource('b', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({ id: 'b-halo', type: 'circle', source: 'b', paint: { 'circle-radius': 13, 'circle-color': '#3B82F6', 'circle-opacity': 0.18 } });
        map.addLayer({ id: 'b-dot',  type: 'circle', source: 'b', paint: { 'circle-radius': 6,  'circle-color': '#3B82F6', 'circle-stroke-color': '#0F0F0F', 'circle-stroke-width': 3 } });
        readyRef.current = true;
        paint(map, lng, lat);
      });
      return () => { map.remove(); readyRef.current = false; };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function paint(m: any, lo: number, la: number) {
    if (!m || !readyRef.current) return;
    m.getSource('b')?.setData({ type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [lo, la] } }] });
  }

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    paint(map, lng, lat);
    map.flyTo({ center: [lng, lat], zoom: 15.5, speed: 1.4, essential: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lng, lat]);

  return <div ref={elRef} style={{ position: 'absolute', inset: 0 }} />;
}

function BranchModal({ mode, data, onSave, onClose }: {
  mode: 'new' | 'edit';
  data?: Partial<{ nombre: string; ciudad: string; codigo: string }>;
  onSave: (d: { nombre: string; ciudad: string; codigo: string }) => void;
  onClose: () => void;
}) {
  const [nombre, setNombre] = useState(data?.nombre ?? '');
  const [ciudad, setCiudad] = useState(data?.ciudad ?? '');
  const [codigo, setCodigo] = useState(data?.codigo ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!nombre || !ciudad) { setError('Nombre y ciudad son obligatorios.'); return; }
    setLoading(true);
    try {
      await onSave({ nombre, ciudad, codigo });
    } catch {
      setError('Ha ocurrido un error. Intente más tarde.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="card" style={{ width: 420, padding: 24, boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 className="ds-h2" style={{ margin: 0 }}>{mode === 'new' ? 'Nueva sucursal' : 'Editar sucursal'}</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><Icon name="x" size={16} /></button>
        </div>
        {error && <div role="alert" style={{ fontSize: 13, color: 'var(--color-danger)', marginBottom: 14 }}>{error}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field"><label className="field-label">Código</label><input className="input" value={codigo} onChange={e => setCodigo(e.target.value)} placeholder="SUC-01" /></div>
          <div className="field"><label className="field-label">Nombre *</label><input className="input" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre de la sucursal" /></div>
          <div className="field"><label className="field-label">Ciudad *</label><input className="input" value={ciudad} onChange={e => setCiudad(e.target.value)} placeholder="Ciudad" /></div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22 }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {loading ? <><Icon name="loader" size={16} />Guardando…</> : <><Icon name="check-circle-2" size={16} />{mode === 'new' ? 'Crear' : 'Guardar'}</>}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

export function BranchesView() {
  const [branches, setBranches] = useState<SucursalDTO[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'ok'>('loading');
  const [sel, setSel] = useState(0);
  const [modal, setModal] = useState<{ mode: 'new' | 'edit'; data?: Partial<SucursalDTO> } | null>(null);

  const fetchBranches = useCallback(async () => {
    setStatus('loading');
    try {
      const data = await listarSucursales();
      setBranches(data);
      setStatus('ok');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => { fetchBranches(); }, [fetchBranches]);

  const b = branches[Math.min(sel, branches.length - 1)];
  const coords = b ? (COORDS[b.nombre] ?? DEFAULT_CENTER) : DEFAULT_CENTER;
  const lat = Array.isArray(coords) ? coords[1] : (coords as { lat: number; lng: number }).lat;
  const lng = Array.isArray(coords) ? coords[0] : (coords as { lat: number; lng: number }).lng;

  async function handleSave(d: { nombre: string; ciudad: string; codigo: string }) {
    if (modal?.mode === 'new') {
      const created = await crearSucursal(d);
      setBranches(prev => [...prev, created]);
      setSel(branches.length);
    } else if (b) {
      const updated = await actualizarSucursal(b.id, d);
      setBranches(prev => prev.map(x => x.id === updated.id ? updated : x));
    }
    setModal(null);
  }

  async function toggleEstado(branch: SucursalDTO) {
    try {
      const updated = await cambiarEstadoSucursal(branch.id, !branch.habilitada);
      setBranches(prev => prev.map(x => x.id === updated.id ? updated : x));
    } catch {
      alert('No se pudo cambiar el estado de la sucursal.');
    }
  }

  const ciudades = new Set(branches.map(x => x.ciudad)).size;
  const habilitadas = branches.filter(x => x.habilitada).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {[
          { label: 'Sucursales activas',  value: habilitadas, icon: 'store',   accent: 'info' },
          { label: 'Ciudades',            value: ciudades,    icon: 'map-pin', accent: 'orange' },
          { label: 'Total sucursales',    value: branches.length, icon: 'building-2', accent: 'neutral' },
        ].map(c => (
          <div key={c.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px' }}>
            <span className="kpi-ico" style={{ width: 40, height: 40, color: 'var(--color-' + c.accent + ')' }}><Icon name={c.icon} size={20} /></span>
            <div>
              <div className="kpi-label">{c.label}</div>
              <div className="ds-kpi" style={{ fontSize: 26, marginTop: 2 }}>{status === 'loading' ? '—' : c.value}</div>
            </div>
          </div>
        ))}
      </div>

      {status === 'error' ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div role="alert">
            <Icon name="alert-circle" size={22} style={{ color: 'var(--color-danger)' }} />
            <div className="ds-sm" style={{ marginTop: 8 }}>Ha ocurrido un error inesperado. Intente más tarde.</div>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={fetchBranches}>Reintentar</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 16, alignItems: 'stretch' }}>
          <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: 560 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--bg-border)' }}>
              <span className="ds-h3">Sucursales</span>
              <button className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => setModal({ mode: 'new' })}>
                <Icon name="plus" size={14} />Nueva
              </button>
            </div>
            {status === 'loading' ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="loader" size={20} style={{ color: 'var(--text-disabled)' }} />
              </div>
            ) : (
              <div className="ds-scroll" style={{ overflowY: 'auto', flex: 1 }}>
                {branches.map((x, i) => {
                  const on = i === sel;
                  return (
                    <button key={x.id} onClick={() => setSel(i)} style={{
                      width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px', border: 'none', borderBottom: '1px solid var(--bg-border)', cursor: 'pointer',
                      borderLeft: '2px solid ' + (on ? 'var(--color-info)' : 'transparent'),
                      background: on ? 'var(--bg-surface-3)' : 'transparent',
                    }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', flex: 'none', background: x.habilitada ? 'var(--color-success)' : 'var(--color-neutral)' }} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div className="ds-sm" style={{ color: 'var(--text-primary)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{x.nombre}</div>
                        <div className="ds-label" style={{ fontSize: 11 }}>{x.ciudad} {x.codigo ? `· ${x.codigo}` : ''}</div>
                      </div>
                      {!x.habilitada && <Badge kind="neutral">Inactiva</Badge>}
                    </button>
                  );
                })}
                {branches.length === 0 && (
                  <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <Icon name="building-2" size={22} />
                    <div className="ds-sm" style={{ marginTop: 8 }}>No hay sucursales registradas</div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 0, position: 'relative', height: 560, overflow: 'hidden' }}>
            {b && <BranchMap lat={lat} lng={lng} />}
            {b && (
              <div style={{ position: 'absolute', top: 16, left: 16, width: 280, background: 'rgba(26,26,26,0.92)', backdropFilter: 'blur(8px)', border: '1px solid var(--bg-border-strong)', borderRadius: 12, padding: 16, boxShadow: 'var(--shadow-pop)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div>
                    <div className="ds-h3" style={{ fontSize: 16 }}>{b.nombre}</div>
                    <div className="ds-label" style={{ fontSize: 11, marginTop: 2 }}>{b.ciudad} {b.codigo ? `· ${b.codigo}` : ''}</div>
                  </div>
                  <Badge kind={b.habilitada ? 'success' : 'neutral'}>{b.habilitada ? 'Activa' : 'Inactiva'}</Badge>
                </div>
                <div style={{ height: 1, background: 'var(--bg-border)', margin: '14px 0' }} />
                {!COORDS[b.nombre] && (
                  <div className="ds-label" style={{ fontSize: 11, color: 'var(--text-disabled)', marginBottom: 10 }}>
                    Coordenadas no disponibles — mostrando centro por defecto
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}
                    onClick={() => setModal({ mode: 'edit', data: b })}>
                    <Icon name="pencil" size={14} />Editar
                  </button>
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, color: b.habilitada ? 'var(--color-danger)' : 'var(--color-success)' }}
                    onClick={() => toggleEstado(b)}>
                    <Icon name={b.habilitada ? 'toggle-left' : 'toggle-right'} size={14} />
                    {b.habilitada ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {modal && (
        <BranchModal
          mode={modal.mode}
          data={modal.data}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
