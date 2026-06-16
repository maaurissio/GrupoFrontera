import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Icon } from '../components/Icon';
import { Badge, ModalOverlay } from '../components/Primitives';
import { listarSucursales, crearSucursal, actualizarSucursal, cambiarEstadoSucursal } from '../api/sucursales';
import { listarRegiones, listarCiudades } from '../api/geografia';
import type { SucursalDTO, RegionDTO, CiudadDTO } from '../api/types';

declare const maplibregl: any;

function currentTheme(): 'light' | 'dark' {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

// Estilo del mapa según el tema: tiles light_all / dark_all de CARTO.
function makeMapStyle(theme: 'light' | 'dark') {
  const variant = theme === 'light' ? 'light_all' : 'dark_all';
  return {
    version: 8,
    sources: {
      carto: {
        type: 'raster',
        tiles: [
          `https://a.basemaps.cartocdn.com/${variant}/{z}/{x}/{y}.png`,
          `https://b.basemaps.cartocdn.com/${variant}/{z}/{x}/{y}.png`,
          `https://c.basemaps.cartocdn.com/${variant}/{z}/{x}/{y}.png`,
        ],
        tileSize: 256,
        attribution: '© OpenStreetMap © CARTO',
      },
    },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': theme === 'light' ? '#E8E8E8' : '#0F0F0F' } },
      { id: 'carto', type: 'raster', source: 'carto' },
    ],
  };
}

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
  const coordsRef = useRef<[number, number]>([lng, lat]);

  function addMarkers(map: any) {
    if (map.getSource('b')) return;
    map.addSource('b', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    map.addLayer({ id: 'b-halo', type: 'circle', source: 'b', paint: { 'circle-radius': 13, 'circle-color': '#3B82F6', 'circle-opacity': 0.18 } });
    map.addLayer({ id: 'b-dot',  type: 'circle', source: 'b', paint: { 'circle-radius': 6,  'circle-color': '#3B82F6', 'circle-stroke-color': '#FFFFFF', 'circle-stroke-width': 3 } });
    paint(map);
  }

  function paint(m: any) {
    const [lo, la] = coordsRef.current;
    m?.getSource('b')?.setData({ type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [lo, la] } }] });
  }

  useEffect(() => {
    if (!window.maplibregl && !mapRef.current) {
      import('maplibre-gl').then(ml => { (window as any).maplibregl = ml.default; init(); });
    } else { init(); }

    function init() {
      if (!maplibregl || !elRef.current || mapRef.current) return;
      import('maplibre-gl/dist/maplibre-gl.css').catch(() => {});
      const map = new maplibregl.Map({
        container: elRef.current, style: makeMapStyle(currentTheme()),
        center: coordsRef.current, zoom: 15.5,
        attributionControl: { compact: true },
      });
      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
      map.on('load', () => { readyRef.current = true; addMarkers(map); });
    }

    return () => { mapRef.current?.remove(); mapRef.current = null; readyRef.current = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cambio de tema: intercambia el basemap y vuelve a pintar el marcador (setStyle limpia capas).
  useEffect(() => {
    function onPrefs() {
      const map = mapRef.current;
      if (!map || !readyRef.current) return;
      map.setStyle(makeMapStyle(currentTheme()));
      map.once('styledata', () => addMarkers(map));
    }
    window.addEventListener('prefs-changed', onPrefs);
    return () => window.removeEventListener('prefs-changed', onPrefs);
  }, []);

  useEffect(() => {
    coordsRef.current = [lng, lat];
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    paint(map);
    map.flyTo({ center: [lng, lat], zoom: 15.5, speed: 1.4, essential: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lng, lat]);

  return <div ref={elRef} style={{ position: 'absolute', inset: 0 }} />;
}

interface BranchFormData { nombre: string; ciudad: string; ciudadId: number | null; codigo: string; latitud: number | null; longitud: number | null }

function BranchModal({ mode, data, onSave, onClose }: {
  mode: 'new' | 'edit';
  data?: Partial<SucursalDTO>;
  onSave: (d: BranchFormData) => void;
  onClose: () => void;
}) {
  const [nombre, setNombre] = useState(data?.nombre ?? '');
  const [codigo, setCodigo] = useState(data?.codigo ?? '');
  const [regionId, setRegionId] = useState<number | ''>('');
  const [ciudadId, setCiudadId] = useState<number | ''>('');
  const [lat, setLat] = useState(data?.latitud != null ? String(data.latitud) : '');
  const [lng, setLng] = useState(data?.longitud != null ? String(data.longitud) : '');
  const [regiones, setRegiones] = useState<RegionDTO[]>([]);
  const [ciudades, setCiudades] = useState<CiudadDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carga el catalogo geografico (regiones + ciudades) una sola vez.
  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const [regs, ciuds] = await Promise.all([
          listarRegiones(ctrl.signal),
          listarCiudades(undefined, ctrl.signal),
        ]);
        setRegiones(regs);
        setCiudades(ciuds);
        // En edicion, preselecciona region+ciudad a partir del ciudadId guardado.
        if (data?.ciudadId != null) {
          const c = ciuds.find(x => x.id === data.ciudadId);
          if (c) { setRegionId(c.regionId); setCiudadId(c.id); }
        }
      } catch {
        if (!ctrl.signal.aborted) setError('No se pudo cargar regiones/ciudades.');
      }
    })();
    return () => ctrl.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ciudadesRegion = useMemo(
    () => (regionId === '' ? [] : ciudades.filter(c => c.regionId === regionId)),
    [ciudades, regionId],
  );

  async function handleSave() {
    if (regionId === '') { setError('La región es obligatoria.'); return; }
    if (!nombre.trim()) { setError('El nombre es obligatorio.'); return; }
    if (ciudadId === '') { setError('La ciudad es obligatoria.'); return; }
    const latNum = lat.trim() === '' ? null : Number(lat);
    const lngNum = lng.trim() === '' ? null : Number(lng);
    if (latNum != null && (Number.isNaN(latNum) || latNum < -90 || latNum > 90)) { setError('La latitud debe estar entre -90 y 90.'); return; }
    if (lngNum != null && (Number.isNaN(lngNum) || lngNum < -180 || lngNum > 180)) { setError('La longitud debe estar entre -180 y 180.'); return; }
    if ((latNum == null) !== (lngNum == null)) { setError('Ingresa latitud y longitud, o deja ambas vacías.'); return; }
    const ciudadNombre = ciudades.find(c => c.id === ciudadId)?.nombre ?? '';
    setLoading(true);
    try {
      await onSave({ nombre: nombre.trim(), ciudad: ciudadNombre, ciudadId, codigo: codigo.trim(), latitud: latNum, longitud: lngNum });
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
          <div className="field">
            <label className="field-label">Región *</label>
            <select className="input" value={regionId}
              onChange={e => { const v = e.target.value === '' ? '' : Number(e.target.value); setRegionId(v); setCiudadId(''); }}>
              <option value="">Selecciona una región…</option>
              {regiones.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
            </select>
          </div>
          <div className="field"><label className="field-label">Nombre *</label><input className="input" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre de la sucursal" /></div>
          <div className="field">
            <label className="field-label">Ciudad *</label>
            <select className="input" value={ciudadId} disabled={regionId === ''}
              onChange={e => setCiudadId(e.target.value === '' ? '' : Number(e.target.value))}>
              <option value="">{regionId === '' ? 'Primero elige una región' : 'Selecciona una ciudad…'}</option>
              {ciudadesRegion.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div className="field"><label className="field-label">Código</label><input className="input" value={codigo} onChange={e => setCodigo(e.target.value)} placeholder="SUC-01" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="field"><label className="field-label">Latitud</label><input className="input" value={lat} onChange={e => setLat(e.target.value)} placeholder="-33.4489" inputMode="decimal" /></div>
            <div className="field"><label className="field-label">Longitud</label><input className="input" value={lng} onChange={e => setLng(e.target.value)} placeholder="-70.6693" inputMode="decimal" /></div>
          </div>
          <div className="ds-label" style={{ fontSize: 11, color: 'var(--text-disabled)', marginTop: -4 }}>
            Latitud y longitud son opcionales — definen la ubicación exacta en el mapa.
          </div>
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

// Mapa grande con TODAS las sucursales (marcadores + popup con el nombre).
function AllBranchesMap({ branches }: { branches: SucursalDTO[] }) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  // Resuelve coords: las guardadas en la sucursal, o la tabla estatica por nombre.
  const puntos = useMemo(() => branches.map(b => {
    const fallback = COORDS[b.nombre];
    const lat = b.latitud != null ? b.latitud : fallback?.lat;
    const lng = b.longitud != null ? b.longitud : fallback?.lng;
    return (lat != null && lng != null) ? { b, lat, lng } : null;
  }).filter((x): x is { b: SucursalDTO; lat: number; lng: number } => x != null), [branches]);

  useEffect(() => {
    if (!window.maplibregl && !mapRef.current) {
      import('maplibre-gl').then(ml => { (window as any).maplibregl = ml.default; init(); });
    } else { init(); }

    function init() {
      if (!maplibregl || !elRef.current || mapRef.current) return;
      import('maplibre-gl/dist/maplibre-gl.css').catch(() => {});
      const map = new maplibregl.Map({
        container: elRef.current, style: makeMapStyle(currentTheme()),
        center: DEFAULT_CENTER, zoom: 3.4,
        attributionControl: { compact: true },
      });
      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
      map.on('load', () => {
        const bounds = new maplibregl.LngLatBounds();
        puntos.forEach(({ b, lat, lng }) => {
          const color = b.habilitada ? '#3B82F6' : '#9CA3AF';
          const popup = new maplibregl.Popup({ offset: 18, closeButton: false })
            .setHTML(`<strong>${b.nombre}</strong><br/>${b.ciudad}`);
          new maplibregl.Marker({ color }).setLngLat([lng, lat]).setPopup(popup).addTo(map);
          bounds.extend([lng, lat]);
        });
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { padding: 70, maxZoom: 11, duration: 0 });
        }
      });
    }

    return () => { mapRef.current?.remove(); mapRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={elRef} style={{ position: 'absolute', inset: 0 }} />;
}

function AllBranchesMapModal({ branches, onClose }: { branches: SucursalDTO[]; onClose: () => void }) {
  return (
    <ModalOverlay onClose={onClose}>
      <div className="card" style={{ width: 'min(1100px, 92vw)', height: '80vh', padding: 0, display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--bg-border)' }}>
          <div>
            <h2 className="ds-h2" style={{ margin: 0 }}>Todas las sucursales</h2>
            <div className="ds-label" style={{ fontSize: 11, marginTop: 2 }}>{branches.length} sucursales en el mapa</div>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><Icon name="x" size={16} /></button>
        </div>
        <div style={{ position: 'relative', flex: 1 }}>
          <AllBranchesMap branches={branches} />
        </div>
      </div>
    </ModalOverlay>
  );
}

function ConfirmBranchModal({ branch, onClose, onConfirm }: {
  branch: SucursalDTO;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const desactivar = branch.habilitada;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      await onConfirm();
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
        <h2 className="ds-h3" style={{ margin: '0 0 8px' }}>{desactivar ? 'Desactivar sucursal' : 'Activar sucursal'}</h2>
        <p className="ds-sm" style={{ margin: '0 0 20px' }}>
          ¿Seguro que deseas {desactivar ? 'desactivar' : 'activar'} la sucursal <b style={{ color: 'var(--text-primary)' }}>{branch.nombre}</b>?
        </p>
        {error && <div role="alert" style={{ fontSize: 13, color: 'var(--color-danger)', marginBottom: 14 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancelar</button>
          <button className={desactivar ? 'btn btn-danger' : 'btn btn-primary'} onClick={handleConfirm} disabled={loading}>
            {loading ? 'Confirmando…' : 'Confirmar'}
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
  const [confirm, setConfirm] = useState<SucursalDTO | null>(null);
  const [showAllMap, setShowAllMap] = useState(false);

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
  // Prioridad: coords guardadas en la sucursal → tabla estática por nombre → centro por defecto.
  const hasCoords = b?.latitud != null && b?.longitud != null;
  const fallback = b ? (COORDS[b.nombre] ?? null) : null;
  const lat = hasCoords ? (b!.latitud as number) : (fallback ? fallback.lat : DEFAULT_CENTER[1]);
  const lng = hasCoords ? (b!.longitud as number) : (fallback ? fallback.lng : DEFAULT_CENTER[0]);

  async function handleSave(d: BranchFormData) {
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
    const updated = await cambiarEstadoSucursal(branch.id, !branch.habilitada);
    setBranches(prev => prev.map(x => x.id === updated.id ? updated : x));
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
            {branches.length > 0 && (
              <button className="btn btn-secondary btn-sm"
                style={{ position: 'absolute', top: 16, right: 16, zIndex: 5, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(26,26,26,0.92)', backdropFilter: 'blur(8px)', border: '1px solid var(--bg-border-strong)' }}
                onClick={() => setShowAllMap(true)}>
                <Icon name="map" size={14} />Ver todas en el mapa
              </button>
            )}
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
                {!hasCoords && !COORDS[b.nombre] && (
                  <div className="ds-label" style={{ fontSize: 11, color: 'var(--text-disabled)', marginBottom: 10 }}>
                    Coordenadas no disponibles — mostrando centro por defecto. Edita la sucursal para fijarlas.
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}
                    onClick={() => setModal({ mode: 'edit', data: b })}>
                    <Icon name="pencil" size={14} />Editar
                  </button>
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, color: b.habilitada ? 'var(--color-danger)' : 'var(--color-success)' }}
                    onClick={() => setConfirm(b)}>
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

      {confirm && (
        <ConfirmBranchModal
          branch={confirm}
          onConfirm={() => toggleEstado(confirm)}
          onClose={() => setConfirm(null)}
        />
      )}

      {showAllMap && (
        <AllBranchesMapModal branches={branches} onClose={() => setShowAllMap(false)} />
      )}
    </div>
  );
}
