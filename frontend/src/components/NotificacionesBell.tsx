import { NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from '../api/client'

export function NotificacionesBell() {
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
  )
}
