import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { Compra, Proveedor, Producto } from '../api/types'
import { ProductoAutocomplete } from '../components/ProductoAutocomplete'

interface ItemForm {
  productoId: string
  cantidad: string
}

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
}

export function ProveedoresPage() {
  const [tab, setTab] = useState<'proveedores' | 'pedidos'>('proveedores')
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [compras, setCompras] = useState<Compra[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')

  const [showFormPedido, setShowFormPedido] = useState(false)
  const [proveedorIdSel, setProveedorIdSel] = useState('')
  const [items, setItems] = useState<ItemForm[]>([{ productoId: '', cantidad: '' }])
  const [monto, setMonto] = useState('')
  const [errorPedido, setErrorPedido] = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get<Proveedor[]>('/proveedores'),
      api.get<Producto[]>('/productos'),
      api.get<Compra[]>('/compras'),
    ])
      .then(([pr, p, c]) => {
        setProveedores(pr)
        setProductos(p)
        setCompras(c)
      })
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

  const openNuevoPedido = () => {
    setProveedorIdSel('')
    setItems([{ productoId: '', cantidad: '' }])
    setMonto('')
    setErrorPedido('')
    setShowFormPedido(true)
  }

  const updateItem = (idx: number, patch: Partial<ItemForm>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  }
  const addItem = () => setItems((prev) => [...prev, { productoId: '', cantidad: '' }])
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx))

  const handleSubmitPedido = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorPedido('')
    if (!proveedorIdSel) {
      setErrorPedido('Elegí un proveedor')
      return
    }
    const validItems = items
      .filter((it) => it.productoId && it.cantidad)
      .map((it) => ({ productoId: it.productoId, cantidad: Number(it.cantidad) }))
    if (validItems.length === 0) {
      setErrorPedido('Agregá al menos un producto')
      return
    }
    try {
      await api.post('/compras', {
        proveedorId: proveedorIdSel,
        items: validItems,
        monto: monto ? Number(monto) : undefined,
      })
      setShowFormPedido(false)
      load()
    } catch (err) {
      setErrorPedido(err instanceof Error ? err.message : 'Error al registrar el pedido')
    }
  }

  const filtrados = proveedores.filter((p) =>
    p.nombre.toLowerCase().includes(query.toLowerCase()),
  )

  if (loading) return <p className="p-4 text-center text-secondary">Cargando...</p>

  return (
    <div className="mx-auto max-w-lg p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="heading-display text-lg">Proveedores</h2>
        <button
          onClick={() => (tab === 'proveedores' ? setShowForm(true) : openNuevoPedido())}
          className="rounded-md px-4 py-2 text-sm font-bold uppercase tracking-wide btn-primary"
        >
          {tab === 'proveedores' ? '+ Proveedor' : '+ Pedido'}
        </button>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setTab('proveedores')}
          className={`flex-1 rounded-md py-2 text-xs font-bold uppercase tracking-wide ${
            tab === 'proveedores' ? 'btn-primary' : 'surface-muted text-label'
          }`}
        >
          Proveedores
        </button>
        <button
          onClick={() => setTab('pedidos')}
          className={`flex-1 rounded-md py-2 text-xs font-bold uppercase tracking-wide ${
            tab === 'pedidos' ? 'btn-primary' : 'surface-muted text-label'
          }`}
        >
          Pedidos
        </button>
      </div>

      {error && <p className="mb-3 rounded-md p-3 text-sm error-banner">{error}</p>}

      {tab === 'proveedores' && (
        <>
          <div className="relative mb-4">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-muted">
              🔍
            </span>
            <input
              placeholder="Buscar proveedor..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-md py-2.5 pl-10 pr-3 text-base field-input"
            />
          </div>

          <ul className="flex flex-col gap-2">
            {filtrados.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/proveedores/${p.id}`}
                  className="flex items-center justify-between rounded-lg p-4 surface"
                >
                  <div>
                    <p className="font-bold uppercase tracking-wide text-heading">{p.nombre}</p>
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
        </>
      )}

      {tab === 'pedidos' && (
        <ul className="flex flex-col gap-3">
          {compras.map((c) => (
            <li key={c.id} className="rounded-lg p-4 surface">
              <div className="flex items-start justify-between">
                <p className="font-bold uppercase tracking-wide text-heading">{c.proveedor.nombre}</p>
                <span className="text-xs text-muted">{fmtFecha(c.fecha)}</span>
              </div>
              <ul className="mt-2 space-y-0.5 text-sm text-secondary">
                {c.items.map((it) => (
                  <li key={it.id}>
                    {it.cantidad} {it.unidad} · {it.producto.nombre}
                  </li>
                ))}
              </ul>
              {c.monto != null && <p className="mt-1 text-xs text-muted">💵 ${c.monto.toFixed(2)}</p>}
            </li>
          ))}
          {compras.length === 0 && (
            <p className="py-8 text-center text-sm text-muted">Todavía no hay pedidos a proveedores.</p>
          )}
        </ul>
      )}

      {showForm && (
        <div className="fixed inset-0 z-20 flex items-end bg-black/40 sm:items-center sm:justify-center">
          <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-t-2xl p-5 sm:rounded-lg surface">
            <h3 className="heading-display mb-4 text-base">Nuevo proveedor</h3>
            <label className="mb-3 block text-sm font-medium text-label">
              Nombre
              <input
                name="nombre"
                required
                className="mt-1 w-full rounded-md px-3 py-2 text-base field-input"
              />
            </label>
            <label className="mb-4 block text-sm font-medium text-label">
              Teléfono (opcional)
              <input
                name="telefono"
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

      {showFormPedido && (
        <div className="fixed inset-0 z-20 flex items-end bg-black/40 sm:items-center sm:justify-center">
          <form
            onSubmit={handleSubmitPedido}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl p-5 sm:rounded-lg surface"
          >
            <h3 className="heading-display mb-4 text-base">Nuevo pedido a proveedor</h3>

            {errorPedido && <p className="mb-3 rounded-md p-3 text-sm error-banner">{errorPedido}</p>}

            <label className="mb-3 block text-sm font-medium text-label">
              Proveedor
              <select
                value={proveedorIdSel}
                onChange={(e) => setProveedorIdSel(e.target.value)}
                className="mt-1 w-full rounded-md px-3 py-2 text-base field-input"
              >
                <option value="">Elegí un proveedor</option>
                {proveedores.map((pr) => (
                  <option key={pr.id} value={pr.id}>
                    {pr.nombre}
                  </option>
                ))}
              </select>
            </label>

            <p className="mb-2 text-sm font-medium text-label">Productos</p>
            <div className="flex flex-col gap-2">
              {items.map((it, idx) => {
                const producto = productos.find((p) => p.id === it.productoId)
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <ProductoAutocomplete
                      productos={productos}
                      value={it.productoId}
                      onSelect={(p) => updateItem(idx, { productoId: p.id })}
                    />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={producto?.unidad ?? 'cant.'}
                      value={it.cantidad}
                      onChange={(e) => updateItem(idx, { cantidad: e.target.value })}
                      className="w-24 rounded-md px-2 py-2 text-sm field-input"
                    />
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="rounded-md px-2.5 py-1.5 text-sm surface-muted text-secondary"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
            <button type="button" onClick={addItem} className="mt-2 text-sm font-bold link-accent">
              + Agregar producto
            </button>

            <label className="mb-4 mt-4 block text-sm font-medium text-label">
              Monto (opcional)
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="$"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="mt-1 w-full rounded-md px-3 py-2 text-base field-input"
              />
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowFormPedido(false)}
                className="flex-1 rounded-md py-2.5 text-sm font-bold uppercase tracking-wide surface-muted text-label"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 rounded-md py-2.5 text-sm font-bold uppercase tracking-wide btn-primary"
              >
                Confirmar pedido
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
