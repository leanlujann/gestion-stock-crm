import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { StockPage } from './pages/StockPage'
import { PedidosPage } from './pages/PedidosPage'
import { ClientesPage } from './pages/ClientesPage'
import { ClienteDetailPage } from './pages/ClienteDetailPage'
import { ProveedoresPage } from './pages/ProveedoresPage'
import { ProveedorDetailPage } from './pages/ProveedorDetailPage'
import { NotificacionesPage } from './pages/NotificacionesPage'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
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
