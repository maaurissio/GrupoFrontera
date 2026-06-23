import { useState, useEffect, useCallback, useRef } from 'react';
import { Icon } from '../components/Icon';
import { Badge, Panel, ModalOverlay } from '../components/Primitives';
import { useDebounce } from '../hooks/useDebounce';
import { listarSucursales } from '../api/sucursales';
import { listarProductos, crearProducto, importarProductos, ajustarStockProducto } from '../api/productos';
import { exportarInventario } from '../api/reportes';
import { CATEGORIAS } from '../api/types';
import type {
  SucursalDTO, ProductoDTO, ProductoCreatePayload, ImportResultado, CategoriaProducto,
} from '../api/types';

const CATEGORIA_LABEL: Record<string, string> = Object.fromEntries(
  CATEGORIAS.map(c => [c.value, c.label]),
);

const CATEGORIA_KIND: Record<string, string> = {
  ELECTRODOMESTICO: 'info',
  TV: 'orange',
  MOVIL: 'success',
  CONSOLA: 'yellow',
  COMPUTACION: 'info',
  AUDIO: 'orange',
  ACCESORIO: 'neutral',
  OTRO: 'neutral',
};

function fmtClp(n: number): string {
  return '$' + Math.round(n).toLocaleString('es-CL');
}

function formatDate(dt: string | null | undefined): string {
  if (!dt) return '—';
  try { return new Date(dt).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' }); }
  catch { return dt; }
}

function categoriaLabel(cat: string): string {
  return CATEGORIA_LABEL[cat] ?? cat;
}

interface FormState {
  codigo: string;
  nombre: string;
  sucursalId: number | '';
  categoria: CategoriaProducto;
  stock: string;
  stockMinimo: string;
  precio: string;
  descripcion: string;
}

const EMPTY_FORM: FormState = {
  codigo: '', nombre: '', sucursalId: '', categoria: 'ELECTRODOMESTICO',
  stock: '', stockMinimo: '', precio: '', descripcion: '',
};

function NuevoProductoModal({
  sucursales, onClose, onCreated,
}: {
  sucursales: SucursalDTO[];
  onClose: () => void;
  onCreated: (p: ProductoDTO) => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  const valid =
    form.codigo.trim() !== '' &&
    form.nombre.trim() !== '' &&
    form.sucursalId !== '' &&
    form.stock !== '' && Number(form.stock) >= 0 &&
    form.stockMinimo !== '' && Number(form.stockMinimo) >= 0 &&
    form.precio !== '' && Number(form.precio) >= 0;

  async function submit() {
    if (!valid) return;
    setSaving(true);
    setError(null);
    const payload: ProductoCreatePayload = {
      codigo: form.codigo.trim(),
      nombre: form.nombre.trim(),
      sucursalId: Number(form.sucursalId),
      categoria: form.categoria,
      stock: Number(form.stock),
      stockMinimo: Number(form.stockMinimo),
      precio: Number(form.precio),
      descripcion: form.descripcion.trim() === '' ? null : form.descripcion.trim(),
    };
    try {
      const created = await crearProducto(payload);
      onCreated(created);
      onClose();
    } catch (err) {
      const status = (err as { status?: number }).status;
      setError(
        status === 409
          ? 'Ya existe un producto con ese código en la sucursal seleccionada.'
          : 'No se pudo crear el producto. Revisa los datos e intenta nuevamente.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="card" style={{ width: 520, maxWidth: '92vw', padding: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: '1px solid var(--bg-border)' }}>
          <span className="ds-h3">Nuevo producto</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><Icon name="x" size={14} /></button>
        </div>
        <div style={{ padding: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="field">
            <label className="field-label">Código</label>
            <input className="input" value={form.codigo} onChange={e => set('codigo', e.target.value)} style={{ height: 34 }} />
          </div>
          <div className="field">
            <label className="field-label">Nombre</label>
            <input className="input" value={form.nombre} onChange={e => set('nombre', e.target.value)} style={{ height: 34 }} />
          </div>
          <div className="field">
            <label className="field-label">Sucursal</label>
            <select className="input select" value={form.sucursalId}
              onChange={e => set('sucursalId', e.target.value === '' ? '' : Number(e.target.value))} style={{ height: 34 }}>
              <option value="">Selecciona…</option>
              {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="field-label">Categoría</label>
            <select className="input select" value={form.categoria}
              onChange={e => set('categoria', e.target.value as CategoriaProducto)} style={{ height: 34 }}>
              {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="field-label">Stock</label>
            <input className="input" type="number" min={0} value={form.stock} onChange={e => set('stock', e.target.value)} style={{ height: 34 }} />
          </div>
          <div className="field">
            <label className="field-label">Stock mínimo</label>
            <input className="input" type="number" min={0} value={form.stockMinimo} onChange={e => set('stockMinimo', e.target.value)} style={{ height: 34 }} />
          </div>
          <div className="field">
            <label className="field-label">Precio (CLP)</label>
            <input className="input" type="number" min={0} value={form.precio} onChange={e => set('precio', e.target.value)} style={{ height: 34 }} />
          </div>
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label className="field-label">Descripción (opcional)</label>
            <input className="input" value={form.descripcion} onChange={e => set('descripcion', e.target.value)} style={{ height: 34 }} />
          </div>
          {error && (
            <div role="alert" style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-danger)' }}>
              <Icon name="alert-circle" size={16} />
              <span className="ds-sm">{error}</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '14px 18px', borderTop: '1px solid var(--bg-border)' }}>
          <button className="btn btn-ghost btn-sm" style={{ height: 34 }} onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary btn-sm" style={{ height: 34, display: 'flex', alignItems: 'center', gap: 6 }} disabled={!valid || saving} onClick={submit}>
            {saving ? <><Icon name="loader" size={14} />Guardando…</> : <><Icon name="check" size={14} />Crear producto</>}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

function AjustarStockModal({
  producto, onClose, onAjustado,
}: {
  producto: ProductoDTO;
  onClose: () => void;
  onAjustado: (p: ProductoDTO) => void;
}) {
  const [cantidad, setCantidad] = useState('');
  const [saving, setSaving] = useState<'add' | 'sub' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cantidadNum = Number(cantidad);
  const valid = cantidad.trim() !== '' && Number.isInteger(cantidadNum) && cantidadNum > 0;

  async function aplicar(signo: 1 | -1) {
    if (!valid) return;
    setSaving(signo === 1 ? 'add' : 'sub');
    setError(null);
    try {
      const actualizado = await ajustarStockProducto(producto.id, signo * cantidadNum);
      onAjustado(actualizado);
      onClose();
    } catch (err) {
      const status = (err as { status?: number }).status;
      setError(
        status === 400
          ? 'El stock no puede quedar negativo.'
          : 'No se pudo ajustar el stock. Intenta nuevamente.',
      );
    } finally {
      setSaving(null);
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="card" style={{ width: 380, maxWidth: '92vw', padding: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: '1px solid var(--bg-border)' }}>
          <span className="ds-h3">Ajustar stock</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><Icon name="x" size={14} /></button>
        </div>
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div className="ds-sm" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{producto.nombre}</div>
            <div className="ds-sm" style={{ color: 'var(--text-secondary)' }}>
              Stock actual: <span className="ds-mono">{producto.stock.toLocaleString('es-CL')}</span>
            </div>
          </div>
          <div className="field">
            <label className="field-label">Cantidad</label>
            <input
              className="input" type="number" min={1} value={cantidad}
              onChange={e => setCantidad(e.target.value)}
              placeholder="0"
              style={{ height: 34 }}
            />
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
          <button className="btn btn-danger btn-sm" style={{ height: 34, display: 'flex', alignItems: 'center', gap: 6 }} disabled={!valid || !!saving} onClick={() => aplicar(-1)}>
            {saving === 'sub' ? <><Icon name="loader" size={14} />Restando…</> : <><Icon name="minus" size={14} />Restar</>}
          </button>
          <button className="btn btn-primary btn-sm" style={{ height: 34, display: 'flex', alignItems: 'center', gap: 6 }} disabled={!valid || !!saving} onClick={() => aplicar(1)}>
            {saving === 'add' ? <><Icon name="loader" size={14} />Agregando…</> : <><Icon name="plus" size={14} />Agregar</>}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

export function ProductosView() {
  const [sucursales, setSucursales] = useState<SucursalDTO[]>([]);
  const [productos, setProductos] = useState<ProductoDTO[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'ok'>('loading');

  const [sucursalId, setSucursalId] = useState<number | ''>('');
  const [categoria, setCategoria] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const q = useDebounce(busqueda, 350);

  const [showNuevo, setShowNuevo] = useState(false);
  const [ajustando, setAjustando] = useState<ProductoDTO | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResultado | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const ac = new AbortController();
    listarSucursales(ac.signal).then(setSucursales).catch(() => {});
    return () => ac.abort();
  }, []);

  const fetchProductos = useCallback(async (suc: number | '', cat: string, search: string) => {
    setStatus('loading');
    const ac = new AbortController();
    try {
      const data = await listarProductos({
        sucursalId: suc === '' ? undefined : suc,
        categoria: cat || undefined,
        q: search || undefined,
      }, ac.signal);
      setProductos(data);
      setStatus('ok');
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setStatus('error');
    }
  }, []);

  useEffect(() => { fetchProductos(sucursalId, categoria, q); }, [sucursalId, categoria, q, fetchProductos]);

  function clearFiltros() {
    setSucursalId(''); setCategoria(''); setBusqueda('');
  }

  function onStockAjustado(actualizado: ProductoDTO) {
    setProductos(prev => prev.map(p => (p.id === actualizado.id ? actualizado : p)));
  }

  async function doExport(fmt: 'pdf' | 'xlsx') {
    setExporting(fmt);
    setExportError(null);
    try {
      await exportarInventario(sucursalId === '' ? null : sucursalId, fmt);
    } catch (err) {
      const sstatus = (err as { status?: number }).status;
      setExportError(
        sstatus === 404
          ? 'No hay inventario para exportar con el filtro seleccionado.'
          : 'No se pudo generar el reporte. Intenta nuevamente.',
      );
    } finally {
      setExporting(null);
    }
  }

  function onImportClick() {
    setImportError(null);
    setImportResult(null);
    fileRef.current?.click();
  }

  function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite re-importar el mismo archivo
    if (!file) return;
    setImporting(true);
    setImportError(null);
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!Array.isArray(parsed)) {
          throw new Error('El archivo debe contener un arreglo JSON de productos.');
        }
        const result = await importarProductos(parsed as ProductoCreatePayload[]);
        setImportResult(result);
        fetchProductos(sucursalId, categoria, q);
      } catch (err) {
        setImportError(
          err instanceof SyntaxError
            ? 'El archivo no es un JSON válido.'
            : (err as Error).message || 'No se pudo importar el archivo.',
        );
      } finally {
        setImporting(false);
      }
    };
    reader.onerror = () => {
      setImporting(false);
      setImportError('No se pudo leer el archivo.');
    };
    reader.readAsText(file);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <input ref={fileRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={onFileSelected} />

      {/* Filtros + acciones */}
      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 12, padding: '14px 16px' }}>
        <div className="field" style={{ minWidth: 180 }}>
          <label className="field-label">Sucursal</label>
          <select className="input select" value={sucursalId} onChange={e => setSucursalId(e.target.value === '' ? '' : Number(e.target.value))} style={{ height: 34 }}>
            <option value="">Todas</option>
            {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </div>
        <div className="field" style={{ minWidth: 170 }}>
          <label className="field-label">Categoría</label>
          <select className="input select" value={categoria} onChange={e => setCategoria(e.target.value)} style={{ height: 34 }}>
            <option value="">Todas</option>
            {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div className="field" style={{ minWidth: 240, flex: 1 }}>
          <label className="field-label">Buscar</label>
          <div style={{ position: 'relative' }}>
            <Icon name="search" size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
            <input className="input" placeholder="Nombre o código…" value={busqueda} onChange={e => setBusqueda(e.target.value)} style={{ height: 34, paddingLeft: 32, width: '100%' }} />
          </div>
        </div>
        {(sucursalId !== '' || categoria || busqueda) && (
          <button className="btn btn-ghost btn-sm" style={{ height: 34, display: 'flex', alignItems: 'center', gap: 4 }} onClick={clearFiltros}>
            <Icon name="x" size={12} />Limpiar
          </button>
        )}
        <div style={{ flex: 1 }} />
        <button className="btn btn-secondary btn-sm" style={{ height: 34, display: 'flex', alignItems: 'center', gap: 6 }} disabled={importing} onClick={onImportClick}>
          {importing ? <><Icon name="loader" size={14} />Importando…</> : <><Icon name="upload" size={14} />Importar JSON</>}
        </button>
        <button className="btn btn-secondary btn-sm" style={{ height: 34, display: 'flex', alignItems: 'center', gap: 6 }} disabled={!!exporting} onClick={() => doExport('pdf')}>
          {exporting === 'pdf' ? <><Icon name="loader" size={14} />Generando…</> : <><Icon name="file-text" size={14} />Exportar PDF</>}
        </button>
        <button className="btn btn-secondary btn-sm" style={{ height: 34, display: 'flex', alignItems: 'center', gap: 6 }} disabled={!!exporting} onClick={() => doExport('xlsx')}>
          {exporting === 'xlsx' ? <><Icon name="loader" size={14} />Generando…</> : <><Icon name="table" size={14} />Excel</>}
        </button>
        <button className="btn btn-primary btn-sm" style={{ height: 34, display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => setShowNuevo(true)}>
          <Icon name="plus" size={14} />Nuevo producto
        </button>
      </div>

      {exportError && (
        <div role="alert" className="card" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}>
          <Icon name="alert-circle" size={16} />
          <span className="ds-sm">{exportError}</span>
          <button className="btn btn-ghost btn-icon btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setExportError(null)}><Icon name="x" size={14} /></button>
        </div>
      )}

      {importError && (
        <div role="alert" className="card" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}>
          <Icon name="alert-circle" size={16} />
          <span className="ds-sm">{importError}</span>
          <button className="btn btn-ghost btn-icon btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setImportError(null)}><Icon name="x" size={14} /></button>
        </div>
      )}

      {importResult && (
        <div className="card" style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8, borderColor: importResult.rechazados.length > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name={importResult.rechazados.length > 0 ? 'alert-triangle' : 'check-circle'} size={16}
              style={{ color: importResult.rechazados.length > 0 ? 'var(--color-warning)' : 'var(--color-success)' }} />
            <span className="ds-sm" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              {importResult.insertados} insertados, {importResult.rechazados.length} rechazados (de {importResult.total} en el archivo)
            </span>
            <button className="btn btn-ghost btn-icon btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setImportResult(null)}><Icon name="x" size={14} /></button>
          </div>
          {importResult.rechazados.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
              {importResult.rechazados.map((r, i) => (
                <div key={`${r.codigo}-${r.sucursalId}-${i}`} className="ds-sm" style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 8 }}>
                  <span className="ds-mono" style={{ color: 'var(--text-primary)' }}>{r.codigo}</span>
                  <span>· S{r.sucursalId}</span>
                  <span style={{ color: 'var(--color-danger)' }}>· {r.motivo}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tabla */}
      <Panel style={{ padding: 0 }} bodyStyle={{ padding: 0 }} title="Catálogo de productos"
        action={<span className="ds-label">{status === 'ok' ? `${productos.length} productos` : ''}</span>}>
        {status === 'loading' ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <Icon name="loader" size={20} style={{ color: 'var(--text-disabled)' }} />
            <div className="ds-sm" style={{ marginTop: 8, color: 'var(--text-secondary)' }}>Cargando productos…</div>
          </div>
        ) : status === 'error' ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div role="alert">
              <Icon name="alert-circle" size={22} style={{ color: 'var(--color-danger)' }} />
              <div className="ds-sm" style={{ marginTop: 8 }}>Ha ocurrido un error inesperado. Intente más tarde.</div>
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={() => fetchProductos(sucursalId, categoria, q)}>Reintentar</button>
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Sucursal</th>
                  <th style={{ textAlign: 'right' }}>Stock</th>
                  <th style={{ textAlign: 'right' }}>Precio</th>
                  <th>Actualizado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {productos.map(p => {
                  const bajo = p.stock < p.stockMinimo;
                  return (
                    <tr key={p.id}>
                      <td className="ds-mono" style={{ fontSize: 12 }}>{p.codigo}</td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{p.nombre}</td>
                      <td><Badge kind={CATEGORIA_KIND[p.categoria] || 'neutral'}>{categoriaLabel(p.categoria)}</Badge></td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{p.sucursalNombre}</td>
                      <td className="num" style={{ color: bajo ? 'var(--color-warning)' : 'var(--text-primary)', fontWeight: bajo ? 600 : 400 }}
                        title={bajo ? `Bajo el mínimo (${p.stockMinimo})` : undefined}>
                        {bajo && <Icon name="alert-triangle" size={12} style={{ marginRight: 4, verticalAlign: '-1px', color: 'var(--color-warning)' }} />}
                        {p.stock.toLocaleString('es-CL')}
                      </td>
                      <td className="num">{fmtClp(p.precio)}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{formatDate(p.fechaActualizacionStock)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-ghost btn-sm" style={{ height: 28, display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => setAjustando(p)}>
                          <Icon name="package" size={13} />Ajustar stock
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {productos.length === 0 && (
              <div style={{ padding: '40px 16px', textAlign: 'center' }}>
                <Icon name="package" size={22} style={{ color: 'var(--text-disabled)' }} />
                <div className="ds-sm" style={{ marginTop: 8 }}>No hay productos para los filtros seleccionados</div>
              </div>
            )}
          </div>
        )}
      </Panel>

      {showNuevo && (
        <NuevoProductoModal
          sucursales={sucursales}
          onClose={() => setShowNuevo(false)}
          onCreated={() => fetchProductos(sucursalId, categoria, q)}
        />
      )}

      {ajustando && (
        <AjustarStockModal
          producto={ajustando}
          onClose={() => setAjustando(null)}
          onAjustado={onStockAjustado}
        />
      )}
    </div>
  );
}
