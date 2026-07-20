import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import type { Producto, Proveedor, Unidad } from '../api/types'

function estadoColor(producto: Producto) {
  const ratio = producto.stockActual / producto.stockMinimo
  if (ratio < 0.4) return 'bg-red-500'
  if (ratio < 1) return 'bg-amber-500'
  return 'bg-emerald-500'
}

function fmtVencimiento(iso: string) {
  // iso viene como fecha (sin hora); se usan getters UTC para no correr un día
  // al formatear en una zona horaria detrás de UTC (ej. Argentina, UTC-3).
  const fecha = new Date(iso)
  const dias = (fecha.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  const dd = String(fecha.getUTCDate()).padStart(2, '0')
  const mm = String(fecha.getUTCMonth() + 1).padStart(2, '0')
  const yy = String(fecha.getUTCFullYear()).slice(-2)
  const color = dias < 0 ? 'text-red-500' : dias < 60 ? 'text-amber-600 dark:text-amber-400' : 'text-muted'
  return { texto: `${dd}/${mm}/${yy}`, color }
}

export function StockPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Producto | null>(null)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([api.get<Producto[]>('/productos'), api.get<Proveedor[]>('/proveedores')])
      .then(([p, pr]) => {
        setProductos(p)
        setProveedores(pr)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openNuevo = () => {
    setEditing(null)
    setShowForm(true)
  }

  const openEditar = (p: Producto) => {
    setEditing(p)
    setShowForm(true)
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const form = new FormData(e.currentTarget)
    const payload = {
      nombre: String(form.get('nombre')),
      unidad: String(form.get('unidad')) as Unidad,
      stockMinimo: Number(form.get('stockMinimo')),
      proveedorId: String(form.get('proveedorId')) || undefined,
      fechaVencimiento: String(form.get('fechaVencimiento')) || undefined,
      notas: String(form.get('notas')) || undefined,
      ...(editing ? {} : { stockActual: Number(form.get('stockActual')) }),
    }
    try {
      if (editing) {
        await api.patch(`/productos/${editing.id}`, payload)
      } else {
        await api.post('/productos', payload)
      }
      setShowForm(false)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    }
  }

  const handleAjuste = async (producto: Producto, delta: number) => {
    try {
      await api.post(`/productos/${producto.id}/ajustar-stock`, { delta })
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al ajustar stock')
    }
  }

  const filtrados = productos.filter((p) => p.nombre.toLowerCase().includes(query.toLowerCase()))

  if (loading) return <p className="p-4 text-center text-secondary">Cargando...</p>

  return (
    <div className="mx-auto max-w-lg p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="heading-display text-lg">Productos</h2>
        <button onClick={openNuevo} className="rounded-md px-4 py-2 text-sm font-bold uppercase tracking-wide btn-primary">
          + Producto
        </button>
      </div>

      <div className="relative mb-4">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-muted">
          🔍
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar producto..."
          className="w-full rounded-md py-2.5 pl-10 pr-3 text-base field-input"
        />
      </div>

      {error && <p className="mb-3 rounded-md p-3 text-sm error-banner">{error}</p>}

      <ul className="flex flex-col gap-3">
        {filtrados.map((p) => {
          const ratio = Math.min(p.stockActual / p.stockMinimo, 1)
          return (
            <li key={p.id} className="rounded-lg p-4 surface">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold uppercase tracking-wide text-heading">
                    {p.nombre}
                    {p.fechaVencimiento && (
                      <span className={`ml-2 text-xs font-normal normal-case ${fmtVencimiento(p.fechaVencimiento).color}`}>
                        venc. {fmtVencimiento(p.fechaVencimiento).texto}
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-secondary">
                    {p.stockActual} {p.unidad} <span className="text-muted">· mínimo {p.stockMinimo}</span>
                  </p>
                  {p.proveedor && <p className="text-xs text-muted">Proveedor: {p.proveedor.nombre}</p>}
                  {p.notas && <p className="text-xs text-muted">Nota: {p.notas}</p>}
                </div>
                <button
                  onClick={() => openEditar(p)}
                  className="rounded-md px-3 py-1 text-xs font-bold uppercase tracking-wide surface-muted text-label"
                >
                  Editar
                </button>
              </div>

              <div className="mt-3 h-2 w-full overflow-hidden rounded-full surface-muted">
                <div
                  className={`h-full rounded-full ${estadoColor(p)}`}
                  style={{ width: `${ratio * 100}%` }}
                />
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => handleAjuste(p, -1)}
                  className="flex-1 rounded-md py-1.5 text-sm font-bold surface-muted surface-muted-hover text-label"
                >
                  -1 {p.unidad}
                </button>
                <button
                  onClick={() => handleAjuste(p, 1)}
                  className="flex-1 rounded-md py-1.5 text-sm font-bold surface-muted surface-muted-hover text-label"
                >
                  +1 {p.unidad}
                </button>
              </div>
            </li>
          )
        })}
        {filtrados.length === 0 && productos.length > 0 && (
          <p className="py-8 text-center text-sm text-muted">Sin resultados para "{query}".</p>
        )}
        {productos.length === 0 && (
          <p className="py-8 text-center text-sm text-muted">Todavía no hay productos cargados.</p>
        )}
      </ul>

      {showForm && (
        <div className="fixed inset-0 z-20 flex items-end bg-black/40 sm:items-center sm:justify-center">
          <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-t-2xl p-5 sm:rounded-lg surface">
            <h3 className="heading-display mb-4 text-base">
              {editing ? 'Editar producto' : 'Nuevo producto'}
            </h3>

            <label className="mb-3 block text-sm font-medium text-label">
              Nombre
              <input
                name="nombre"
                required
                defaultValue={editing?.nombre}
                className="mt-1 w-full rounded-md px-3 py-2 text-base field-input"
              />
            </label>

            <label className="mb-3 block text-sm font-medium text-label">
              Unidad
              <select
                name="unidad"
                defaultValue={editing?.unidad ?? 'KG'}
                className="mt-1 w-full rounded-md px-3 py-2 text-base field-input"
              >
                <option value="KG">Kilogramos (KG)</option>
                <option value="LT">Litros (LT)</option>
                <option value="UN">Unidades (UN)</option>
              </select>
            </label>

            {!editing && (
              <label className="mb-3 block text-sm font-medium text-label">
                Stock inicial
                <input
                  name="stockActual"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={0}
                  className="mt-1 w-full rounded-md px-3 py-2 text-base field-input"
                />
              </label>
            )}

            <label className="mb-3 block text-sm font-medium text-label">
              Stock mínimo (aviso)
              <input
                name="stockMinimo"
                type="number"
                step="0.01"
                min="0"
                defaultValue={editing?.stockMinimo ?? 50}
                className="mt-1 w-full rounded-md px-3 py-2 text-base field-input"
              />
            </label>

            <label className="mb-3 block text-sm font-medium text-label">
              Fecha de vencimiento (opcional)
              <input
                name="fechaVencimiento"
                type="date"
                defaultValue={editing?.fechaVencimiento?.slice(0, 10) ?? ''}
                className="mt-1 w-full rounded-md px-3 py-2 text-base field-input"
              />
            </label>

            <label className="mb-3 block text-sm font-medium text-label">
              Notas (opcional)
              <input
                name="notas"
                defaultValue={editing?.notas ?? ''}
                placeholder="ej. tambor completo, 1/4 restante..."
                className="mt-1 w-full rounded-md px-3 py-2 text-base field-input"
              />
            </label>

            <label className="mb-4 block text-sm font-medium text-label">
              Proveedor (opcional)
              <select
                name="proveedorId"
                defaultValue={editing?.proveedorId ?? ''}
                className="mt-1 w-full rounded-md px-3 py-2 text-base field-input"
              >
                <option value="">Sin proveedor</option>
                {proveedores.map((pr) => (
                  <option key={pr.id} value={pr.id}>
                    {pr.nombre}
                  </option>
                ))}
              </select>
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
