import { Route, Routes } from 'react-router-dom'
import { Layout, type TabDef } from './components/Layout'
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
  { to: '/', label: 'Stock', icon: '📦', scene: 'stock', end: true },
  { to: '/pedidos', label: 'Pedidos', icon: '🧾', scene: 'pedidos' },
  { to: '/clientes', label: 'Clientes', icon: '👥', scene: 'crm' },
  { to: '/proveedores', label: 'Proveedores', icon: '🚚', scene: 'proveedores' },
]

const TABS_CLIENTE: TabDef[] = [
  { to: '/', label: 'Catálogo', icon: '📦', scene: 'stock', end: true },
  { to: '/mis-pedidos', label: 'Mis pedidos', icon: '🧾', scene: 'pedidos' },
]

function App() {
  const { autenticado, cargando, role } = useAuth()

  if (cargando) return null
  if (!autenticado) return <LoginPage />

  if (role === 'CLIENTE') {
    return (
      <Routes>
        <Route element={<Layout titulo="Gestión de Stock" tabs={TABS_CLIENTE} />}>
          <Route path="/" element={<CatalogoPage />} />
          <Route path="/mis-pedidos" element={<MisPedidosPage />} />
        </Route>
      </Routes>
    )
  }

  return (
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
  )
}

export default App
