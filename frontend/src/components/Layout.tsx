import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { api } from '../api/client'
import { ThemeToggle } from './ThemeToggle'
import { useTheme } from '../theme'
import { useAuth } from '../auth'

const TABS = [
  { to: '/', label: 'Stock', icon: '📦', end: true },
  { to: '/pedidos', label: 'Pedidos', icon: '🧾' },
  { to: '/clientes', label: 'Clientes', icon: '👥' },
  { to: '/proveedores', label: 'Proveedores', icon: '🚚' },
]

function getScene(pathname: string) {
  if (pathname.startsWith('/pedidos')) return 'pedidos'
  if (pathname.startsWith('/clientes')) return 'crm'
  if (pathname.startsWith('/proveedores')) return 'proveedores'
  return 'stock'
}

// espejo de los colores base definidos en index.css (.bg-scene-*)
const SCENE_COLORS: Record<string, { light: string; dark: string }> = {
  stock: { light: '#eaf7f0', dark: '#071f1a' },
  pedidos: { light: '#e9f6f6', dark: '#051e24' },
  crm: { light: '#eaf6f4', dark: '#061b26' },
  proveedores: { light: '#f1f7e6', dark: '#10200a' },
}

export function Layout() {
  const [noLeidas, setNoLeidas] = useState(0)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const { theme } = useTheme()
  const { username, logout } = useAuth()
  const scene = getScene(location.pathname)

  useEffect(() => {
    if (!menuAbierto) return
    const cerrarSiToqueAfuera = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuAbierto(false)
    }
    document.addEventListener('pointerdown', cerrarSiToqueAfuera)
    return () => document.removeEventListener('pointerdown', cerrarSiToqueAfuera)
  }, [menuAbierto])

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', SCENE_COLORS[scene][theme])
    document.documentElement.setAttribute('data-scene', scene)
  }, [scene, theme])

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
    <div className="flex h-dvh flex-col app-bg">
      <div className={`bg-scene bg-scene-${scene}`} aria-hidden="true" />

      <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 backdrop-blur-md bg-[#EDE6D6]/50 dark:bg-black/15">
        <h1 className="heading-display text-lg">Gestión de Stock</h1>
        <div className="relative flex items-center gap-2">
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
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuAbierto((v) => !v)}
              aria-label="Cuenta"
              className="flex h-9 w-9 items-center justify-center rounded-full text-lg surface-muted"
            >
              👤
            </button>
            {menuAbierto && (
              <div className="absolute right-0 top-11 z-20 w-48 rounded-md p-3 shadow-lg surface">
                <p className="mb-2 truncate text-xs text-muted">Conectado como</p>
                <p className="mb-3 truncate text-sm font-bold text-heading">{username}</p>
                <button
                  onClick={() => {
                    setMenuAbierto(false)
                    logout()
                  }}
                  className="w-full rounded-md py-2 text-xs font-bold uppercase tracking-wide surface-muted-hover text-red-600 dark:text-red-400"
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-28">
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
                `flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-full px-1 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition-colors ${
                  isActive ? 'bg-[#17140F]/10 text-heading dark:bg-white/15' : 'text-muted'
                }`
              }
            >
              <span className="text-xl leading-none">{tab.icon}</span>
              <span className="w-full truncate text-center">{tab.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
