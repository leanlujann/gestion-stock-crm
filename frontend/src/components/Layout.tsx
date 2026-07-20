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
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 warm:bg-amber-50 warm:text-stone-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 warm:border-amber-200 warm:bg-amber-50 dark:border-slate-800 dark:bg-slate-950">
        <h1 className="text-lg font-semibold">Gestión de Stock</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <NavLink
            to="/notificaciones"
            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-lg warm:bg-amber-100 dark:bg-slate-800"
          >
            🔔
            {noLeidas > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-semibold text-white">
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
        className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white warm:border-amber-200 warm:bg-amber-50 dark:border-slate-800 dark:bg-slate-950"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto flex max-w-lg">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium ${
                  isActive
                    ? 'text-violet-600 dark:text-violet-400'
                    : 'text-slate-500 warm:text-stone-500 dark:text-slate-400'
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
