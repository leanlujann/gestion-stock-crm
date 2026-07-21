import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import type { Lote, Producto, Proveedor, Unidad } from '../api/types'

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

function proximoVencimiento(lotes: Lote[]) {
  const conFecha = lotes.filter((l) => l.fechaVencimiento)
  if (conFecha.length === 0) return null
  return conFecha.reduce((min, l) =>
    l.fechaVencimiento! < min.fechaVencimiento! ? l : min,
  )
}

export function StockPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Producto | null>(null)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set())
  const [agregandoLoteId, setAgregandoLoteId] = useState<string | null>(null)
  const [cantidades, setCantidades] = useState<Record<string, string>>({})

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

  const toggleExpandido = (id: string) => {
    setExpandidos((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const form = new FormData(e.currentTarget)
    const base = {
      nombre: String(form.get('nombre')),
      unidad: String(form.get('unidad')) as Unidad,
      stockMinimo: Number(form.get('stockMinimo')),
      precio: form.get('precio') ? Number(form.get('precio')) : undefined,
      proveedorId: String(form.get('proveedorId')) || undefined,
    }
    try {
      if (editing) {
        await api.patch(`/productos/${editing.id}`, base)
      } else {
        await api.post('/productos', {
          ...base,
          stockActual: Number(form.get('stockActual')),
          fechaVencimiento: String(form.get('fechaVencimiento')) || undefined,
          notas: String(form.get('notas')) || undefined,
        })
      }
      setShowForm(false)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    }
  }

  const handleEliminar = async (producto: Producto) => {
    if (!window.confirm(`¿Borrar "${producto.nombre}" del stock? Esta acción no se puede deshacer.`)) return
    setError('')
    try {
      await api.delete(`/productos/${producto.id}`)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al borrar el producto')
    }
  }

  const handleAjuste = async (producto: Producto, signo: 1 | -1) => {
    const cantidad = Number(cantidades[producto.id])
    const delta = signo * (cantidad > 0 ? cantidad : 1)
    try {
      await api.post(`/productos/${producto.id}/ajustar-stock`, { delta })
      setCantidades((prev) => ({ ...prev, [producto.id]: '' }))
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al ajustar stock')
    }
  }

  const handleAgregarLote = async (e: FormEvent<HTMLFormElement>, productoId: string) => {
    e.preventDefault()
    setError('')
    const form = new FormData(e.currentTarget)
    try {
      await api.post(`/productos/${productoId}/lotes`, {
        cantidad: Number(form.get('cantidad')),
        fechaVencimiento: String(form.get('fechaVencimiento')) || undefined,
        notas: String(form.get('notas')) || undefined,
      })
      setAgregandoLoteId(null)
      setExpandidos((prev) => new Set(prev).add(productoId))
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al agregar el lote')
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
          const lotes = p.lotes ?? []
          const proximo = proximoVencimiento(lotes)
          const expandido = expandidos.has(p.id)
          return (
            <li key={p.id} className="rounded-lg p-4 surface">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold uppercase tracking-wide text-heading">
                    {p.nombre}
                    {proximo && (
                      <span className={`ml-2 text-xs font-normal normal-case ${fmtVencimiento(proximo.fechaVencimiento!).color}`}>
                        venc. {fmtVencimiento(proximo.fechaVencimiento!).texto}
                        {lotes.length > 1 && ` (+${lotes.length - 1} más)`}
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-secondary">
                    {p.stockActual} {p.unidad} <span className="text-muted">· mínimo {p.stockMinimo}</span>
                    {p.precio != null && <span className="text-muted"> · ${p.precio}/{p.unidad}</span>}
                  </p>
                  {p.proveedor && <p className="text-xs text-muted">Proveedor: {p.proveedor.nombre}</p>}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => openEditar(p)}
                    className="rounded-md px-3 py-1 text-xs font-bold uppercase tracking-wide surface-muted text-label"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleEliminar(p)}
                    aria-label={`Borrar ${p.nombre}`}
                    className="rounded-md px-2.5 py-1 text-xs font-bold surface-muted text-red-600 dark:text-red-400"
                  >
                    🗑
                  </button>
                </div>
              </div>

              <div className="mt-3 h-2 w-full overflow-hidden rounded-full surface-muted">
                <div
                  className={`h-full rounded-full ${estadoColor(p)}`}
                  style={{ width: `${ratio * 100}%` }}
                />
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => handleAjuste(p, -1)}
                  className="rounded-md px-3 py-1.5 text-sm font-bold surface-muted surface-muted-hover text-label"
                >
                  −
                </button>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={`cant. ${p.unidad}`}
                  value={cantidades[p.id] ?? ''}
                  onChange={(e) => setCantidades((prev) => ({ ...prev, [p.id]: e.target.value }))}
                  className="w-0 flex-1 rounded-md px-2 py-1.5 text-center text-sm field-input"
                />
                <button
                  onClick={() => handleAjuste(p, 1)}
                  className="rounded-md px-3 py-1.5 text-sm font-bold surface-muted surface-muted-hover text-label"
                >
                  +
                </button>
              </div>

              <div className="mt-3 flex items-center justify-between border-t pt-2 border-[#17140F]/15 dark:border-[#EDE6D6]/15">
                {lotes.length > 0 ? (
                  <button
                    onClick={() => toggleExpandido(p.id)}
                    className="text-xs font-bold uppercase tracking-wide link-accent"
                  >
                    {expandido ? '▾' : '▸'} Ver lotes ({lotes.length})
                  </button>
                ) : (
                  <span className="text-xs text-muted">Sin vencimiento registrado</span>
                )}
                <button
                  onClick={() => setAgregandoLoteId(agregandoLoteId === p.id ? null : p.id)}
                  className="text-xs font-bold uppercase tracking-wide link-accent"
                >
                  + Lote
                </button>
              </div>

              {expandido && (
                <ul className="mt-2 flex flex-col gap-1">
                  {lotes.length === 0 && <li className="text-xs text-muted">Sin lotes registrados.</li>}
                  {lotes.map((l) => (
                    <li key={l.id} className="flex items-baseline justify-between text-xs">
                      <span className="text-secondary">
                        {l.cantidad} {p.unidad}
                        {l.notas && <span className="text-muted"> · {l.notas}</span>}
                      </span>
                      <span className={l.fechaVencimiento ? fmtVencimiento(l.fechaVencimiento).color : 'text-muted'}>
                        {l.fechaVencimiento ? fmtVencimiento(l.fechaVencimiento).texto : 'sin fecha'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {agregandoLoteId === p.id && (
                <form
                  onSubmit={(e) => handleAgregarLote(e, p.id)}
                  className="mt-2 flex flex-col gap-2 rounded-md p-2 surface-muted"
                >
                  <div className="flex gap-2">
                    <input
                      name="cantidad"
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder={`cant. ${p.unidad}`}
                      className="w-24 rounded-md px-2 py-1.5 text-sm field-input"
                    />
                    <input
                      name="fechaVencimiento"
                      type="date"
                      className="flex-1 rounded-md px-2 py-1.5 text-sm field-input"
                    />
                  </div>
                  <input
                    name="notas"
                    placeholder="Notas (opcional)"
                    className="rounded-md px-2 py-1.5 text-sm field-input"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAgregandoLoteId(null)}
                      className="flex-1 rounded-md py-1.5 text-xs font-bold uppercase tracking-wide surface-muted-hover text-label"
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="flex-1 rounded-md py-1.5 text-xs font-bold uppercase tracking-wide btn-primary">
                      Agregar
                    </button>
                  </div>
                </form>
              )}
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
              <>
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
                <label className="mb-3 block text-sm font-medium text-label">
                  Fecha de vencimiento (opcional)
                  <input
                    name="fechaVencimiento"
                    type="date"
                    className="mt-1 w-full rounded-md px-3 py-2 text-base field-input"
                  />
                </label>
                <label className="mb-3 block text-sm font-medium text-label">
                  Notas del lote inicial (opcional)
                  <input
                    name="notas"
                    placeholder="ej. tambor completo, 1/4 restante..."
                    className="mt-1 w-full rounded-md px-3 py-2 text-base field-input"
                  />
                </label>
              </>
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
              Precio unitario (opcional)
              <input
                name="precio"
                type="number"
                step="0.01"
                min="0"
                defaultValue={editing?.precio ?? ''}
                placeholder="$"
                className="mt-1 w-full rounded-md px-3 py-2 text-base field-input"
              />
              <span className="mt-1 block text-xs text-muted">
                Se usa para calcular el monto de los pedidos automáticamente.
              </span>
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

            {editing && (
              <p className="mb-4 text-xs text-muted">
                Para agregar stock con su propia fecha de vencimiento, usá "+ Lote" en la tarjeta del producto.
              </p>
            )}

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
