import { useEffect, useState, type FormEvent } from 'react'
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
  const [showForm, setShowForm] = useState(false)

  const load = () => {
    if (!id) return
    api
      .get<Cliente>(`/clientes/${id}`)
      .then(setCliente)
      .catch((e) => setError(e.message))
  }

  useEffect(load, [id])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!id) return
    setError('')
    const form = new FormData(e.currentTarget)
    try {
      await api.patch(`/clientes/${id}`, {
        nombre: String(form.get('nombre')),
        telefono: String(form.get('telefono')) || undefined,
        direccion: String(form.get('direccion')) || undefined,
      })
      setShowForm(false)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    }
  }

  if (error && !cliente) return <p className="p-4 text-center text-red-500">{error}</p>
  if (!cliente) return <p className="p-4 text-center text-secondary">Cargando...</p>

  return (
    <div className="mx-auto max-w-lg p-4">
      <Link to="/clientes" className="mb-3 inline-block text-sm font-bold link-accent">
        ← Clientes
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h2 className="heading-display text-xl">{cliente.nombre}</h2>
          {cliente.telefono && <p className="text-sm text-secondary">{cliente.telefono}</p>}
          {cliente.direccion && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cliente.direccion)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-sm link-accent"
            >
              📍 {cliente.direccion}
            </a>
          )}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="shrink-0 rounded-md px-3 py-1 text-xs font-bold uppercase tracking-wide surface-muted text-label"
        >
          Editar
        </button>
      </div>

      <h3 className="heading-display mb-2 mt-6 text-sm">Historial de pedidos</h3>
      <ol className="relative flex flex-col gap-4 border-l-2 pl-4 border-[#17140F] dark:border-[#EDE6D6]">
        {cliente.pedidos?.map((p) => (
          <li key={p.id} className="relative">
            <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-[#17140F] dark:bg-[#EDE6D6]" />
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

      {showForm && (
        <div className="fixed inset-0 z-20 flex items-end bg-black/40 sm:items-center sm:justify-center">
          <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-t-2xl p-5 sm:rounded-lg surface">
            <h3 className="heading-display mb-4 text-base">Editar cliente</h3>

            <label className="mb-3 block text-sm font-medium text-label">
              Nombre
              <input
                name="nombre"
                required
                defaultValue={cliente.nombre}
                className="mt-1 w-full rounded-md px-3 py-2 text-base field-input"
              />
            </label>
            <label className="mb-3 block text-sm font-medium text-label">
              Teléfono (opcional)
              <input
                name="telefono"
                defaultValue={cliente.telefono ?? ''}
                className="mt-1 w-full rounded-md px-3 py-2 text-base field-input"
              />
            </label>
            <label className="mb-4 block text-sm font-medium text-label">
              Dirección (opcional)
              <input
                name="direccion"
                placeholder="Calle, número, ciudad..."
                defaultValue={cliente.direccion ?? ''}
                className="mt-1 w-full rounded-md px-3 py-2 text-base field-input"
              />
            </label>

            {error && <p className="mb-4 rounded-md p-3 text-sm error-banner">{error}</p>}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setError('')
                }}
                className="flex-1 rounded-md py-2.5 text-sm font-bold uppercase tracking-wide surface-muted text-label"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 rounded-md py-2.5 text-sm font-bold uppercase tracking-wide btn-primary"
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
