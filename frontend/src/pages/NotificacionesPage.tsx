import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { Notificacion } from '../api/types'

const ICONOS: Record<Notificacion['tipo'], string> = {
  STOCK_BAJO: '⚠️',
  PEDIDO_NUEVO: '🧾',
  COMPRA_REGISTRADA: '🚚',
}

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
}

export function NotificacionesPage() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    api
      .get<Notificacion[]>('/notificaciones')
      .then(setNotificaciones)
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const marcarTodas = async () => {
    await api.patch('/notificaciones/leer-todas')
    load()
  }

  if (loading) return <p className="p-4 text-center text-secondary">Cargando...</p>

  return (
    <div className="mx-auto max-w-lg p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-heading">Notificaciones</h2>
        <button onClick={marcarTodas} className="text-sm font-medium text-violet-600 dark:text-violet-400">
          Marcar todas leídas
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {notificaciones.map((n) => (
          <li
            key={n.id}
            className={`flex gap-3 rounded-xl border p-4 shadow-sm ${
              n.leida
                ? 'surface'
                : 'border-violet-200 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/40'
            }`}
          >
            <span className="text-lg">{ICONOS[n.tipo]}</span>
            <div>
              <p className="text-sm text-heading">{n.mensaje}</p>
              <p className="text-xs text-muted">{fmtFecha(n.createdAt)}</p>
            </div>
          </li>
        ))}
        {notificaciones.length === 0 && (
          <p className="py-8 text-center text-sm text-muted">Sin notificaciones.</p>
        )}
      </ul>
    </div>
  )
}
