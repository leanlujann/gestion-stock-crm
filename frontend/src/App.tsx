import { Route, Routes } from 'react-router-dom'
import { Layout, type TabDef } from './components/Layout'
import { AppShell } from './components/AppShell'
import { NotificacionesBell } from './components/NotificacionesBell'
import { StockPage } from './pages/StockPage'
import { PedidosPage } from './pages/PedidosPage'
import { ClientesPage } from './pages/ClientesPage'
import { ClienteDetailPage } from './pages/ClienteDetailPage'
import { ProveedoresPage } from './pages/ProveedoresPage'
import { ProveedorDetailPage } from './pages/ProveedorDetailPage'
import { NotificacionesPage } from './pages/NotificacionesPage'
import { CatalogoPage } from './pages/cliente/CatalogoPage'
import { MisPedidosPage } from './pages/cliente/MisPedidosPage'
import { LoginPage } from './pages/LoginPage'
import { useAuth } from './auth'

const TABS_STAFF: TabDef[] = [
  { to: '/', label: 'Stock', icon: '📦', end: true },
  { to: '/pedidos', label: 'Pedidos', icon: '🧾' },
  { to: '/clientes', label: 'Clientes', icon: '👥' },
  { to: '/proveedores', label: 'Proveedores', icon: '🚚' },
]

const TABS_CLIENTE: TabDef[] = [
  { to: '/', label: 'Catálogo', icon: '📦', end: true },
  { to: '/mis-pedidos', label: 'Mis pedidos', icon: '🧾' },
]

function App() {
  const { autenticado, cargando, role } = useAuth()

  if (cargando) return null

  return (
    <AppShell>
      {!autenticado ? (
        <LoginPage />
      ) : role === 'CLIENTE' ? (
        <Routes>
          <Route element={<Layout titulo="Gestión de Stock" tabs={TABS_CLIENTE} />}>
            <Route path="/" element={<CatalogoPage />} />
            <Route path="/mis-pedidos" element={<MisPedidosPage />} />
          </Route>
        </Routes>
      ) : (
        <Routes>
          <Route element={<Layout titulo="Gestión de Stock" tabs={TABS_STAFF} extraHeader={<NotificacionesBell />} />}>
            <Route path="/" element={<StockPage />} />
            <Route path="/pedidos" element={<PedidosPage />} />
            <Route path="/clientes" element={<ClientesPage />} />
            <Route path="/clientes/:id" element={<ClienteDetailPage />} />
            <Route path="/proveedores" element={<ProveedoresPage />} />
            <Route path="/proveedores/:id" element={<ProveedorDetailPage />} />
            <Route path="/notificaciones" element={<NotificacionesPage />} />
          </Route>
        </Routes>
      )}
    </AppShell>
  )
}

export default App
