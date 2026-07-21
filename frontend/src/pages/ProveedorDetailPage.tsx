import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { Producto, Proveedor } from '../api/types'
import { ProductoAutocomplete } from '../components/ProductoAutocomplete'

interface ItemForm {
  productoId: string
  cantidad: string
}

function fmtMonto(monto: number) {
  return monto.toFixed(2)
}

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
}

export function ProveedorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [proveedor, setProveedor] = useState<Proveedor | null>(null)
  const [productos, setProductos] = useState<Producto[]>([])
  const [showForm, setShowForm] = useState(false)
  const [items, setItems] = useState<ItemForm[]>([{ productoId: '', cantidad: '' }])
  const [monto, setMonto] = useState('')
  const [error, setError] = useState('')

  const load = () => {
    if (!id) return
    Promise.all([
      api.get<Proveedor>(`/proveedores/${id}`),
      api.get<Producto[]>('/productos'),
    ])
      .then(([pr, p]) => {
        setProveedor(pr)
        setProductos(p)
      })
      .catch((e) => setError(e.message))
  }

  useEffect(load, [id])

  const openNuevaCompra = () => {
    setItems([{ productoId: '', cantidad: '' }])
    setMonto('')
    setError('')
    setShowForm(true)
  }

  const updateItem = (idx: number, patch: Partial<ItemForm>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  }
  const addItem = () => setItems((prev) => [...prev, { productoId: '', cantidad: '' }])
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx))

  const handleSubmit = async () => {
    if (!id) return
    setError('')
    const validItems = items
      .filter((it) => it.productoId && it.cantidad)
      .map((it) => ({ productoId: it.productoId, cantidad: Number(it.cantidad) }))
    if (validItems.length === 0) {
      setError('Agregá al menos un producto')
      return
    }
    try {
      await api.post('/compras', {
        proveedorId: id,
        items: validItems,
        monto: monto ? Number(monto) : undefined,
      })
      setShowForm(false)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar la compra')
    }
  }

  if (error && !proveedor) return <p className="p-4 text-center text-red-500">{error}</p>
  if (!proveedor) return <p className="p-4 text-center text-secondary">Cargando...</p>

  return (
    <div className="mx-auto max-w-lg p-4">
      <Link to="/proveedores" className="mb-3 inline-block text-sm font-bold link-accent">
        ← Proveedores
      </Link>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="heading-display text-xl">{proveedor.nombre}</h2>
          {proveedor.telefono && <p className="text-sm text-secondary">{proveedor.telefono}</p>}
        </div>
        <button
          onClick={openNuevaCompra}
          className="rounded-md px-4 py-2 text-sm font-bold uppercase tracking-wide btn-primary"
        >
          + Compra
        </button>
      </div>

      <h3 className="heading-display mb-2 mt-6 text-sm">Historial de compras</h3>
      <ol className="relative flex flex-col gap-4 border-l-2 pl-4 border-[#17140F] dark:border-[#EDE6D6]">
        {proveedor.compras?.map((c) => (
          <li key={c.id} className="relative">
            <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-[#17140F] dark:bg-[#EDE6D6]" />
            <p className="text-xs text-muted">{fmtFecha(c.fecha)}</p>
            <ul className="mt-1 text-sm text-heading">
              {c.items.map((it) => (
                <li key={it.id}>
                  {it.cantidad} {it.unidad} · {it.producto.nombre}
                </li>
              ))}
            </ul>
            {c.monto != null && <p className="mt-0.5 text-xs text-muted">💵 ${fmtMonto(c.monto)}</p>}
          </li>
        ))}
        {(!proveedor.compras || proveedor.compras.length === 0) && (
          <p className="text-sm text-muted">Sin compras todavía.</p>
        )}
      </ol>

      {showForm && (
        <div className="fixed inset-0 z-20 flex items-end bg-black/40 sm:items-center sm:justify-center">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl p-5 sm:rounded-lg surface">
            <h3 className="heading-display mb-4 text-base">Nueva compra a {proveedor.nombre}</h3>

            {error && <p className="mb-3 rounded-md p-3 text-sm error-banner">{error}</p>}

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

            <label className="mb-1 mt-4 block text-sm font-medium text-label">
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
                Registrar compra
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
