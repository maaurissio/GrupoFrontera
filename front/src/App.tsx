import { useState, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login, ExportModal } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { PageHead, Button } from './components/Primitives';
import { DashboardView } from './views/DashboardView';
import { ReportesView } from './views/ReportesView';
import { UsersView } from './views/UsersView';
import { RolesView } from './views/RolesView';
import { BranchesView } from './views/BranchesView';
import { ConfiguracionView } from './views/ConfiguracionView';
import { ProductosView } from './views/ProductosView';
import { ReportesGuardadosView } from './views/ReportesGuardadosView';
import { puedeVerUsuariosYRoles } from './utils/permisos';
import type { ViewId } from './data';

const TITLES: Record<ViewId, string> = {
  dashboard:         'Resumen',
  reportes:          'Reportes',
  usuarios:          'Usuarios',
  roles:             'Roles',
  sucursales:        'Sucursales',
  configuracion:     'Configuración',
  productos:         'Catálogo de productos',
  reportesGuardados: 'Reportes guardados',
};

const SUBTITLES: Record<ViewId, string> = {
  dashboard:         'Estado operacional en tiempo real · Grupo Cordillera',
  reportes:          'KPIs por sucursal y período · exportables',
  usuarios:          'Roles, sucursales y estado de cuentas',
  roles:             'Roles del sistema y sus permisos',
  sucursales:        'Red de sucursales · ubicación y cobertura',
  configuracion:     'Preferencias del sistema y tu cuenta',
  productos:         'Inventario por sucursal · stock y precios',
  reportesGuardados: 'Historial, favoritos y reportes programados',
};

function AppShell() {
  const { logout, usuario } = useAuth();
  const [view, setView] = useState<ViewId>('dashboard');
  const [exporting, setExporting] = useState(false);
  const scrollRef = useRef<HTMLElement>(null);

  // Defensa en profundidad: aunque el Sidebar ya oculta Usuarios/Roles, esto bloquea
  // el acceso aunque se llegue por otro camino (p.ej. las tarjetas de módulo del Dashboard).
  const vistaRestringida = (view === 'usuarios' || view === 'roles') && !puedeVerUsuariosYRoles(usuario?.roles ?? []);
  const vista = vistaRestringida ? 'dashboard' : view;

  const navigate = (v: ViewId) => {
    setView(v);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };

  const renderView = () => {
    switch (vista) {
      case 'dashboard':     return <DashboardView onNavigate={navigate} />;
      case 'reportes':      return <ReportesView />;
      case 'usuarios':      return <UsersView />;
      case 'roles':         return <RolesView />;
      case 'sucursales':    return <BranchesView />;
      case 'configuracion': return <ConfiguracionView />;
      case 'productos':     return <ProductosView />;
      case 'reportesGuardados': return <ReportesGuardadosView />;
      default:              return <DashboardView onNavigate={navigate} />;
    }
  };

  const headerActions = () => {
    if (vista === 'usuarios') return null;
    if (vista === 'roles') return null;
    if (vista === 'sucursales') return <Button variant="secondary" icon="map">Ver todas en el mapa</Button>;
    if (vista === 'reportes') return null;
    if (vista === 'productos') return null;
    return (
      <>
        <Button variant="secondary" icon="filter">Filtros</Button>
        <Button variant="primary" icon="download" onClick={() => setExporting(true)}>Exportar</Button>
      </>
    );
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar active={vista} onNavigate={navigate} onLogout={logout} />
      <main ref={scrollRef} className="ds-scroll" style={{ flex: 1, overflowY: 'auto', height: '100%', position: 'relative' }}>
        <Topbar title={TITLES[vista]} onExport={() => setExporting(true)} />
        <div style={{ padding: '28px 28px 48px' }}>
          <PageHead title={TITLES[vista]} subtitle={SUBTITLES[vista]}>
            {headerActions()}
          </PageHead>
          {renderView()}
        </div>
      </main>
      {exporting && <ExportModal onClose={() => setExporting(false)} />}
    </div>
  );
}

function AuthGate() {
  const { usuario, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="ds-sm" style={{ color: 'var(--text-secondary)' }}>Cargando…</span>
      </div>
    );
  }
  if (!usuario) return <Login />;
  return <AppShell />;
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
