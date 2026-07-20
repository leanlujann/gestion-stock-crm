import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { Cliente, Pedido, Producto } from '../api/types'

interface ItemForm {
  productoId: string
  cantidad: string
}

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
}

export function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [clienteId, setClienteId] = useState('')
  const [items, setItems] = useState<ItemForm[]>([{ productoId: '', cantidad: '' }])
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get<Pedido[]>('/pedidos'),
      api.get<Cliente[]>('/clientes'),
      api.get<Producto[]>('/productos'),
    ])
      .then(([pe, c, p]) => {
        setPedidos(pe)
        setClientes(c)
        setProductos(p)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openNuevo = () => {
    setClienteId('')
    setItems([{ productoId: '', cantidad: '' }])
    setError('')
    setShowForm(true)
  }

  const updateItem = (idx: number, patch: Partial<ItemForm>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  }

  const addItem = () => setItems((prev) => [...prev, { productoId: '', cantidad: '' }])
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx))

  const handleSubmit = async () => {
    setError('')
    if (!clienteId) {
      setError('Elegí un cliente')
      return
    }
    const validItems = items
      .filter((it) => it.productoId && it.cantidad)
      .map((it) => ({ productoId: it.productoId, cantidad: Number(it.cantidad) }))
    if (validItems.length === 0) {
      setError('Agregá al menos un producto')
      return
    }
    try {
      await api.post('/pedidos', { clienteId, items: validItems })
      setShowForm(false)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el pedido')
    }
  }

  if (loading) return <p className="p-4 text-center text-secondary">Cargando...</p>

  return (
    <div className="mx-auto max-w-lg p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="heading-display text-lg">Pedidos</h2>
        <button onClick={openNuevo} className="rounded-md px-4 py-2 text-sm font-bold uppercase tracking-wide btn-primary">
          + Pedido
        </button>
      </div>

      <ul className="flex flex-col gap-3">
        {pedidos.map((pe) => (
          <li key={pe.id} className="rounded-lg p-4 surface">
            <div className="flex items-start justify-between">
              <p className="font-bold uppercase tracking-wide text-heading">{pe.cliente.nombre}</p>
              <span className="text-xs text-muted">{fmtFecha(pe.fecha)}</span>
            </div>
            <ul className="mt-2 space-y-0.5 text-sm text-secondary">
              {pe.items.map((it) => (
                <li key={it.id}>
                  {it.cantidad} {it.unidad} · {it.producto.nombre}
                </li>
              ))}
            </ul>
          </li>
        ))}
        {pedidos.length === 0 && (
          <p className="py-8 text-center text-sm text-muted">Todavía no hay pedidos.</p>
        )}
      </ul>

      {showForm && (
        <div className="fixed inset-0 z-20 flex items-end bg-black/40 sm:items-center sm:justify-center">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl p-5 sm:rounded-lg surface">
            <h3 className="heading-display mb-4 text-base">Nuevo pedido</h3>

            {error && <p className="mb-3 rounded-md p-3 text-sm error-banner">{error}</p>}

            <label className="mb-3 block text-sm font-medium text-label">
              Cliente
              <select
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                className="mt-1 w-full rounded-md px-3 py-2 text-base field-input"
              >
                <option value="">Elegí un cliente</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
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
                    <select
                      value={it.productoId}
                      onChange={(e) => updateItem(idx, { productoId: e.target.value })}
                      className="flex-1 rounded-md px-2 py-2 text-sm field-input"
                    >
                      <option value="">Producto</option>
                      {productos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} ({p.stockActual} {p.unidad})
                        </option>
                      ))}
                    </select>
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
            <button onClick={addItem} className="mt-2 text-sm font-bold link-accent">
              + Agregar producto
            </button>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-md py-2.5 text-sm font-bold uppercase tracking-wide surface-muted text-label"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 rounded-md py-2.5 text-sm font-bold uppercase tracking-wide btn-primary"
              >
                Confirmar pedido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
