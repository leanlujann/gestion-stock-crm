import { NavLink, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { ThemeToggle } from './ThemeToggle'

const TABS = [
  { to: '/', label: 'Stock', icon: '📦', end: true },
  { to: '/pedidos', label: 'Pedidos', icon: '🧾' },
  { to: '/clientes', label: 'CRM', icon: '👥' },
  { to: '/proveedores', label: 'Proveedores', icon: '🚚' },
]

export function Layout() {
  const [noLeidas, setNoLeidas] = useState(0)

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
      <header className="sticky top-0 z-10 flex items-center justify-between border-b-2 border-[#17140F] px-4 py-3 app-bg dark:border-[#EDE6D6]">
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

      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-10 border-t-2 border-[#17140F] app-bg dark:border-[#EDE6D6]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto flex max-w-lg">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-semibold uppercase tracking-wide ${
                  isActive ? 'text-heading' : 'text-muted'
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
