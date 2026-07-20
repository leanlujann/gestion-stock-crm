import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { Proveedor } from '../api/types'

export function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    api
      .get<Proveedor[]>('/proveedores')
      .then(setProveedores)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const form = new FormData(e.currentTarget)
    try {
      await api.post('/proveedores', {
        nombre: String(form.get('nombre')),
        telefono: String(form.get('telefono')) || undefined,
      })
      setShowForm(false)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    }
  }

  const filtrados = proveedores.filter((p) =>
    p.nombre.toLowerCase().includes(query.toLowerCase()),
  )

  if (loading) return <p className="p-4 text-center text-secondary">Cargando...</p>

  return (
    <div className="mx-auto max-w-lg p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-heading">Proveedores</h2>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white active:bg-violet-700 dark:bg-violet-500 dark:active:bg-violet-600"
        >
          + Proveedor
        </button>
      </div>

      <input
        placeholder="Buscar proveedor..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-4 w-full rounded-lg border px-3 py-2 text-base field-input"
      />

      {error && <p className="mb-3 rounded-lg p-3 text-sm error-banner">{error}</p>}

      <ul className="flex flex-col gap-2">
        {filtrados.map((p) => (
          <li key={p.id}>
            <Link
              to={`/proveedores/${p.id}`}
              className="flex items-center justify-between rounded-xl border p-4 shadow-sm surface"
            >
              <div>
                <p className="font-medium">{p.nombre}</p>
                {p.telefono && <p className="text-sm text-secondary">{p.telefono}</p>}
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
          <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-t-2xl p-5 sm:rounded-2xl surface">
            <h3 className="mb-4 text-base font-semibold">Nuevo proveedor</h3>
            <label className="mb-3 block text-sm font-medium text-label">
              Nombre
              <input
                name="nombre"
                required
                className="mt-1 w-full rounded-lg border px-3 py-2 text-base field-input"
              />
            </label>
            <label className="mb-4 block text-sm font-medium text-label">
              Teléfono (opcional)
              <input
                name="telefono"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-base field-input"
              />
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-lg py-2.5 text-sm font-semibold surface-muted text-label"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 rounded-lg bg-violet-600 py-2.5 text-sm font-semibold text-white dark:bg-violet-500"
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
