import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import type { Pedido } from '../../api/types'

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
}

function fmtFechaEntrega(iso: string) {
  // iso viene como fecha (sin hora); se usan getters UTC para no correr un día
  // al formatear en una zona horaria detrás de UTC (ej. Argentina, UTC-3).
  const fecha = new Date(iso)
  const dd = String(fecha.getUTCDate()).padStart(2, '0')
  const mm = String(fecha.getUTCMonth() + 1).padStart(2, '0')
  const yy = fecha.getUTCFullYear()
  return `${dd}/${mm}/${yy}`
}

const ESTADO_LABEL: Record<Pedido['estado'], string> = {
  PENDIENTE_CONFIRMACION: 'Pendiente de confirmación',
  CONFIRMADO: 'Confirmado',
  ENTREGADO: 'Entregado',
  RECHAZADO: 'Rechazado',
}

const ESTADO_COLOR: Record<Pedido['estado'], string> = {
  PENDIENTE_CONFIRMACION: 'bg-amber-500/20 text-amber-700 dark:text-amber-400',
  CONFIRMADO: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
  ENTREGADO: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
  RECHAZADO: 'bg-red-500/20 text-red-700 dark:text-red-400',
}

export function MisPedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get<Pedido[]>('/pedidos/mios')
      .then(setPedidos)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="p-4 text-center text-secondary">Cargando...</p>
  if (error) return <p className="p-4 text-center text-red-500">{error}</p>

  return (
    <div className="mx-auto max-w-lg p-4">
      <h2 className="heading-display mb-4 text-lg">Mis pedidos</h2>

      <ul className="flex flex-col gap-3">
        {pedidos.map((p) => (
          <li key={p.id} className="rounded-lg p-4 surface">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs text-muted">{fmtFecha(p.fecha)}</p>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${ESTADO_COLOR[p.estado]}`}>
                {ESTADO_LABEL[p.estado]}
              </span>
            </div>

            <ul className="mt-2 flex flex-col gap-1">
              {p.items.map((it) => (
                <li key={it.id} className="text-sm text-heading">
                  {it.cantidad} {it.unidad} · {it.producto.nombre}
                </li>
              ))}
            </ul>

            <div className="mt-3 flex items-center justify-between border-t pt-2 text-sm border-[#17140F]/15 dark:border-[#EDE6D6]/15">
              {p.monto != null && <span className="font-bold text-heading">${p.monto.toFixed(2)}</span>}
              {p.fechaEntrega && (
                <span className="text-muted">Entrega: {fmtFechaEntrega(p.fechaEntrega)}</span>
              )}
            </div>
          </li>
        ))}
        {pedidos.length === 0 && (
          <p className="py-8 text-center text-sm text-muted">Todavía no hiciste ningún pedido.</p>
        )}
      </ul>
    </div>
  )
}
