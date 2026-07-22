import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { Cliente } from '../api/types'

export function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    api
      .get<Cliente[]>('/clientes')
      .then(setClientes)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const form = new FormData(e.currentTarget)
    try {
      await api.post('/clientes', {
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

  const filtrados = clientes.filter((c) =>
    c.nombre.toLowerCase().includes(query.toLowerCase()),
  )

  if (loading) return <p className="p-4 text-center text-secondary">Cargando...</p>

  return (
    <div className="mx-auto max-w-lg p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="heading-display text-lg">Clientes</h2>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-md px-4 py-2 text-sm font-bold uppercase tracking-wide btn-primary"
        >
          + Cliente
        </button>
      </div>

      <div className="relative mb-4 search-wrap">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-muted">
          🔍
        </span>
        <input
          placeholder="Buscar cliente..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full py-2.5 pl-10 pr-3 text-base search-input"
        />
      </div>

      {error && <p className="mb-3 rounded-md p-3 text-sm error-banner">{error}</p>}

      <ul className="flex flex-col gap-2">
        {filtrados.map((c) => (
          <li key={c.id}>
            <Link
              to={`/clientes/${c.id}`}
              className="flex items-center justify-between rounded-lg p-4 surface"
            >
              <div>
                <p className="font-bold uppercase tracking-wide text-heading">{c.nombre}</p>
                {c.telefono && <p className="text-sm text-secondary">{c.telefono}</p>}
              </div>
              <span className="text-muted">›</span>
            </Link>
          </li>
        ))}
        {filtrados.length === 0 && (
          <p className="py-8 text-center text-sm text-muted">Sin resultados.</p>
        )}
      </ul>

      {showForm && (
        <div className="fixed inset-0 z-20 flex items-end bg-black/40 sm:items-center sm:justify-center">
          <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-t-2xl p-5 sm:rounded-lg surface">
            <h3 className="heading-display mb-4 text-base">Nuevo cliente</h3>
            <label className="mb-3 block text-sm font-medium text-label">
              Nombre
              <input
                name="nombre"
                required
                className="mt-1 w-full rounded-md px-3 py-2 text-base field-input"
              />
            </label>
            <label className="mb-3 block text-sm font-medium text-label">
              Teléfono (opcional)
              <input
                name="telefono"
                className="mt-1 w-full rounded-md px-3 py-2 text-base field-input"
              />
            </label>
            <label className="mb-4 block text-sm font-medium text-label">
              Dirección (opcional)
              <input
                name="direccion"
                placeholder="Calle, número, ciudad..."
                className="mt-1 w-full rounded-md px-3 py-2 text-base field-input"
              />
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
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
