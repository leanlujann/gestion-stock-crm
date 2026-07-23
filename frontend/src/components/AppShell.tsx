import { useEffect, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useTheme } from '../theme'

// espejo de los colores base definidos en index.css (.bg-scene-*)
const SCENE_COLORS: Record<string, { light: string; dark: string }> = {
  stock: { light: '#eaf7f0', dark: '#071f1a' },
  pedidos: { light: '#e9f6f6', dark: '#051e24' },
  crm: { light: '#eaf6f4', dark: '#061b26' },
  proveedores: { light: '#f1f7e6', dark: '#10200a' },
}

function sceneFromPath(pathname: string) {
  if (pathname.startsWith('/pedidos') || pathname.startsWith('/mis-pedidos')) return 'pedidos'
  if (pathname.startsWith('/clientes')) return 'crm'
  if (pathname.startsWith('/proveedores')) return 'proveedores'
  return 'stock'
}

// Fondo "liquid glass" persistente: se monta una unica vez a nivel raiz y
// nunca se desmonta (ni al pasar de login a la app, ni entre pantallas). Antes
// tanto LoginPage como Layout renderizaban su propio div de fondo, position:
// fixed; al pasar de uno a otro, WebKit (Safari/iOS) a veces no recompone la
// capa fixed nueva y la pantalla queda pintada de un solo color hasta que se
// recarga la pagina a mano. Con un unico fondo que nunca se desmonta, ese
// swap de capas fixed nunca ocurre.
export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation()
  const { theme } = useTheme()
  const scene = sceneFromPath(location.pathname)

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', SCENE_COLORS[scene][theme])
    document.documentElement.setAttribute('data-scene', scene)
  }, [scene, theme])

  return (
    <div className="flex h-dvh flex-col app-bg">
      <div className={`bg-scene bg-scene-${scene}`} aria-hidden="true" />
      {children}
    </div>
  )
}
