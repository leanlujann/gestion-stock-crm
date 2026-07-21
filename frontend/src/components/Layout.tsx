import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { ThemeToggle } from './ThemeToggle'

const TABS = [
  { to: '/', label: 'Stock', icon: '📦', end: true },
  { to: '/pedidos', label: 'Pedidos', icon: '🧾' },
  { to: '/clientes', label: 'CRM', icon: '👥' },
  { to: '/proveedores', label: 'Proveedores', icon: '🚚' },
]

function getScene(pathname: string) {
  if (pathname.startsWith('/pedidos')) return 'bg-scene-pedidos'
  if (pathname.startsWith('/clientes')) return 'bg-scene-crm'
  if (pathname.startsWith('/proveedores')) return 'bg-scene-proveedores'
  return 'bg-scene-stock'
}

export function Layout() {
  const [noLeidas, setNoLeidas] = useState(0)
  const location = useLocation()

  useEffect(() => {
    let cancelled = false
    const load = () => {
      api
        .get<number>('/notificaciones/no-leidas/count')
        .then((count) => {
          if (!cancelled) setNoLeidas(count)
        })
        .catch(() => {})
    }
    load()
    const interval = setInterval(load, 15000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="flex min-h-screen flex-col app-bg">
      <div className={`bg-scene ${getScene(location.pathname)}`} aria-hidden="true" />

      <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 backdrop-blur-md bg-[#EDE6D6]/50 dark:bg-black/15">
        <h1 className="heading-display text-lg">Gestión de Stock</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <NavLink
            to="/notificaciones"
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-lg surface-muted"
          >
            🔔
            {noLeidas > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-semibold text-white">
                {noLeidas}
              </span>
            )}
          </NavLink>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-28">
        <Outlet />
      </main>

      <nav
        className="fixed inset-x-4 z-10 rounded-full border border-[#17140F]/15 bg-[#F6F2E9]/70 shadow-lg shadow-black/10 backdrop-blur-xl dark:border-white/15 dark:bg-white/10 dark:shadow-black/40"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 14px)' }}
      >
        <div className="mx-auto flex max-w-lg items-center justify-between gap-1 px-2 py-2">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-0.5 rounded-full px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition-colors ${
                  isActive ? 'bg-[#17140F]/10 text-heading dark:bg-white/15' : 'text-muted'
                }`
              }
            >
              <span className="text-xl leading-none">{tab.icon}</span>
              {tab.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
