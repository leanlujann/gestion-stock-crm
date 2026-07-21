import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import type { Cliente, Pedido, Producto } from '../api/types'
import { ProductoAutocomplete } from '../components/ProductoAutocomplete'

interface ItemForm {
  productoId: string
  cantidad: string
}

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
}

function fmtFechaEntrega(iso: string) {
  const fecha = new Date(iso)
  const dd = String(fecha.getUTCDate()).padStart(2, '0')
  const mm = String(fecha.getUTCMonth() + 1).padStart(2, '0')
  const yy = String(fecha.getUTCFullYear()).slice(-2)
  return `${dd}/${mm}/${yy}`
}

const ESTADO_LABEL: Record<string, string> = {
  CONFIRMADO: 'Para Entregar',
  ENTREGADO: 'Entregado',
  PENDIENTE_CONFIRMACION: 'Pendiente',
  RECHAZADO: 'Rechazado',
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
  const [tab, setTab] = useState<'activos' | 'historial'>('activos')

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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
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
    const form = new FormData(e.currentTarget)
    try {
      await api.post('/pedidos', {
        clienteId,
        items: validItems,
        direccion: String(form.get('direccion')) || undefined,
        fechaEntrega: String(form.get('fechaEntrega')) || undefined,
      })
      setShowForm(false)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el pedido')
    }
  }

  const toggleEstado = async (pedido: Pedido) => {
    const nuevoEstado = pedido.estado === 'ENTREGADO' ? 'CONFIRMADO' : 'ENTREGADO'
    try {
      await api.patch(`/pedidos/${pedido.id}/estado`, { estado: nuevoEstado })
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el estado')
    }
  }

  const totalEstimado = items.reduce((total, it) => {
    const producto = productos.find((p) => p.id === it.productoId)
    const cantidad = Number(it.cantidad) || 0
    return total + cantidad * (producto?.precio ?? 0)
  }, 0)

  const pedidosFiltrados = pedidos.filter((pe) =>
    tab === 'historial'
      ? pe.estado === 'ENTREGADO' || pe.estado === 'RECHAZADO'
      : pe.estado !== 'ENTREGADO' && pe.estado !== 'RECHAZADO',
  )

  if (loading) return <p className="p-4 text-center text-secondary">Cargando...</p>

  return (
    <div className="mx-auto max-w-lg p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="heading-display text-lg">Pedidos</h2>
        <button onClick={openNuevo} className="rounded-md px-4 py-2 text-sm font-bold uppercase tracking-wide btn-primary">
          + Pedido
        </button>
      </div>

      {error && <p className="mb-3 rounded-md p-3 text-sm error-banner">{error}</p>}

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setTab('activos')}
          className={`flex-1 rounded-md py-2 text-xs font-bold uppercase tracking-wide ${
            tab === 'activos' ? 'btn-primary' : 'surface-muted text-label'
          }`}
        >
          Para entregar
        </button>
        <button
          onClick={() => setTab('historial')}
          className={`flex-1 rounded-md py-2 text-xs font-bold uppercase tracking-wide ${
            tab === 'historial' ? 'btn-primary' : 'surface-muted text-label'
          }`}
        >
          Historial
        </button>
      </div>

      <ul className="flex flex-col gap-3">
        {pedidosFiltrados.map((pe) => (
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
            {pe.direccion && <p className="mt-1 text-xs text-muted">📍 {pe.direccion}</p>}
            <div className="mt-1 flex items-center gap-3 text-xs text-muted">
              {pe.monto != null && <span>💵 ${pe.monto.toFixed(2)}</span>}
              {pe.fechaEntrega && <span>🚚 entrega {fmtFechaEntrega(pe.fechaEntrega)}</span>}
            </div>
            <button
              onClick={() => toggleEstado(pe)}
              className={`mt-3 rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
                pe.estado === 'ENTREGADO' ? 'surface-muted text-label' : 'btn-primary'
              }`}
            >
              {ESTADO_LABEL[pe.estado] ?? pe.estado}
            </button>
          </li>
        ))}
        {pedidosFiltrados.length === 0 && (
          <p className="py-8 text-center text-sm text-muted">
            {tab === 'historial' ? 'Todavía no hay pedidos entregados.' : 'No hay pedidos para entregar.'}
          </p>
        )}
      </ul>

      {showForm && (
        <div className="fixed inset-0 z-20 flex items-end bg-black/40 sm:items-center sm:justify-center">
          <form
            onSubmit={handleSubmit}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl p-5 sm:rounded-lg surface"
          >
            <h3 className="heading-display mb-4 text-base">Nuevo pedido</h3>

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

            <label className="mb-3 mt-4 block text-sm font-medium text-label">
              Dirección de entrega (opcional)
              <input
                name="direccion"
                placeholder="Calle 123, localidad..."
                className="mt-1 w-full rounded-md px-3 py-2 text-base field-input"
              />
            </label>

            <p className="mb-3 flex items-center justify-between rounded-md px-3 py-2 text-sm surface-muted">
              <span className="font-medium text-label">Monto total</span>
              <span className="font-bold text-heading">${totalEstimado.toFixed(2)}</span>
            </p>

            <label className="mb-4 block text-sm font-medium text-label">
              Fecha de entrega (opcional)
              <input
                name="fechaEntrega"
                type="date"
                className="mt-1 w-full rounded-md px-3 py-2 text-base field-input"
              />
              <span className="mt-1 block text-xs text-muted">
                Si la ponés, se agenda en Google Calendar con aviso a las 8:00 AM.
              </span>
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
                Confirmar pedido
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
