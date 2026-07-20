import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { Cliente } from '../api/types'

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
}

export function ClienteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    api
      .get<Cliente>(`/clientes/${id}`)
      .then(setCliente)
      .catch((e) => setError(e.message))
  }, [id])

  if (error) return <p className="p-4 text-center text-red-500">{error}</p>
  if (!cliente) return <p className="p-4 text-center text-secondary">Cargando...</p>

  return (
    <div className="mx-auto max-w-lg p-4">
      <Link to="/clientes" className="mb-3 inline-block text-sm text-violet-600 dark:text-violet-400">
        ← Clientes
      </Link>
      <h2 className="text-xl font-semibold">{cliente.nombre}</h2>
      {cliente.telefono && <p className="text-sm text-secondary">{cliente.telefono}</p>}

      <h3 className="mb-2 mt-6 text-sm font-semibold text-secondary">Historial de pedidos</h3>
      <ol className="relative flex flex-col gap-4 border-l pl-4 border-slate-200 dark:border-slate-800">
        {cliente.pedidos?.map((p) => (
          <li key={p.id} className="relative">
            <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-violet-500" />
            <p className="text-xs text-muted">{fmtFecha(p.fecha)}</p>
            <ul className="mt-1 text-sm text-heading">
              {p.items.map((it) => (
                <li key={it.id}>
                  {it.cantidad} {it.unidad} · {it.producto.nombre}
                </li>
              ))}
            </ul>
          </li>
        ))}
        {(!cliente.pedidos || cliente.pedidos.length === 0) && (
          <p className="text-sm text-muted">Sin pedidos todavía.</p>
        )}
      </ol>
    </div>
  )
}
