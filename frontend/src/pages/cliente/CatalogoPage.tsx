import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../../api/client'
import type { ProductoCatalogo } from '../../api/types'
import { useAuth } from '../../auth'

export function CatalogoPage() {
  const { username } = useAuth()
  const [productos, setProductos] = useState<ProductoCatalogo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [cantidades, setCantidades] = useState<Record<string, string>>({})
  const [carrito, setCarrito] = useState<Record<string, number>>({})
  const [mostrarResumen, setMostrarResumen] = useState(false)
  const [direccion, setDireccion] = useState('')
  const [fechaEntrega, setFechaEntrega] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [exito, setExito] = useState(false)

  const load = () => {
    setLoading(true)
    api
      .get<ProductoCatalogo[]>('/productos/catalogo')
      .then(setProductos)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const agregar = (productoId: string) => {
    const cantidad = Number(cantidades[productoId])
    if (!cantidad || cantidad <= 0) return
    setCarrito((prev) => ({ ...prev, [productoId]: (prev[productoId] ?? 0) + cantidad }))
    setCantidades((prev) => ({ ...prev, [productoId]: '' }))
  }

  const quitar = (productoId: string) => {
    setCarrito((prev) => {
      const next = { ...prev }
      delete next[productoId]
      return next
    })
  }

  const productosPorId = new Map(productos.map((p) => [p.id, p]))
  const itemsCarrito = Object.entries(carrito)
  const montoEstimado = itemsCarrito.reduce((total, [id, cantidad]) => {
    const producto = productosPorId.get(id)
    return total + cantidad * (producto?.precio ?? 0)
  }, 0)

  const filtrados = productos.filter((p) => p.nombre.toLowerCase().includes(query.toLowerCase()))

  const confirmarPedido = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setEnviando(true)
    try {
      await api.post('/pedidos/mio', {
        items: itemsCarrito.map(([productoId, cantidad]) => ({ productoId, cantidad })),
        direccion: direccion || undefined,
        fechaEntrega,
      })
      setCarrito({})
      setMostrarResumen(false)
      setDireccion('')
      setFechaEntrega('')
      setExito(true)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al hacer el pedido')
    } finally {
      setEnviando(false)
    }
  }

  if (loading) return <p className="p-4 text-center text-secondary">Cargando...</p>

  return (
    <div className="mx-auto max-w-lg p-4 pb-24">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="heading-display text-lg">Catálogo</h2>
      </div>
      <p className="mb-4 text-sm text-secondary">Hola{username ? `, ${username}` : ''}. Elegí lo que necesitás.</p>

      <div className="relative mb-4 search-wrap">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-muted">
          🔍
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar producto..."
          className="w-full py-2.5 pl-10 pr-3 text-base search-input"
        />
      </div>

      {exito && (
        <p className="mb-3 rounded-md p-3 text-sm surface-muted text-emerald-700 dark:text-emerald-400">
          ¡Pedido enviado! Lo vas a poder ver en "Mis pedidos".
        </p>
      )}
      {error && !mostrarResumen && <p className="mb-3 rounded-md p-3 text-sm error-banner">{error}</p>}

      <ul className="flex flex-col gap-3">
        {filtrados.map((p) => (
          <li key={p.id} className="rounded-lg p-4 surface">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-bold uppercase tracking-wide text-heading">{p.nombre}</p>
                <p className="text-sm text-secondary">
                  {p.precio != null ? `$${p.precio} / ${p.unidad}` : p.unidad}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${
                  p.disponible
                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                    : 'bg-red-500/20 text-red-700 dark:text-red-400'
                }`}
              >
                {p.disponible ? 'Disponible' : 'Agotado'}
              </span>
            </div>

            {p.disponible && (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder={`cant. ${p.unidad}`}
                  value={cantidades[p.id] ?? ''}
                  onChange={(e) => setCantidades((prev) => ({ ...prev, [p.id]: e.target.value }))}
                  className="w-0 flex-1 rounded-md px-2 py-1.5 text-center text-sm field-input"
                />
                <button
                  onClick={() => agregar(p.id)}
                  className="rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide surface-muted surface-muted-hover text-label"
                >
                  Agregar
                </button>
              </div>
            )}

            {carrito[p.id] > 0 && (
              <p className="mt-2 text-xs text-muted">En tu pedido: {carrito[p.id]} {p.unidad}</p>
            )}
          </li>
        ))}
        {filtrados.length === 0 && (
          <p className="py-8 text-center text-sm text-muted">Sin resultados.</p>
        )}
      </ul>

      {itemsCarrito.length > 0 && !mostrarResumen && (
        <button
          onClick={() => setMostrarResumen(true)}
          className="fixed inset-x-4 z-10 rounded-full py-3 text-sm font-bold uppercase tracking-wide shadow-lg btn-primary"
          style={{ bottom: 'calc(env(safe-area-inset-bottom) + 84px)' }}
        >
          🛒 {itemsCarrito.length} producto{itemsCarrito.length > 1 ? 's' : ''} — Hacer pedido
        </button>
      )}

      {mostrarResumen && (
        <div
          className="fixed inset-0 z-20 flex items-end bg-black/40 sm:items-center sm:justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget && !enviando) setMostrarResumen(false)
          }}
        >
          <form onSubmit={confirmarPedido} className="w-full max-w-lg rounded-t-2xl p-5 sm:rounded-lg surface">
            <h3 className="heading-display mb-4 text-base">Confirmar pedido</h3>

            <ul className="mb-4 flex flex-col gap-2">
              {itemsCarrito.map(([id, cantidad]) => {
                const producto = productosPorId.get(id)
                if (!producto) return null
                return (
                  <li key={id} className="flex items-center justify-between rounded-md p-2 text-sm surface-muted">
                    <span className="text-label">{cantidad} {producto.unidad} · {producto.nombre}</span>
                    <div className="flex items-center gap-2">
                      {producto.precio != null && (
                        <span className="text-muted">${(cantidad * producto.precio).toFixed(2)}</span>
                      )}
                      <button
                        type="button"
                        onClick={() => quitar(id)}
                        aria-label={`Quitar ${producto.nombre}`}
                        className="text-red-600 dark:text-red-400"
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>

            <p className="mb-4 text-right text-sm font-bold text-heading">Total estimado: ${montoEstimado.toFixed(2)}</p>

            <label className="mb-3 block text-sm font-medium text-label">
              Fecha de entrega deseada
              <input
                type="date"
                required
                value={fechaEntrega}
                onChange={(e) => setFechaEntrega(e.target.value)}
                className="mt-1 w-full rounded-md px-3 py-2 text-base field-input"
              />
            </label>
            <label className="mb-4 block text-sm font-medium text-label">
              Dirección de entrega (opcional)
              <input
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Calle, número, ciudad..."
                className="mt-1 w-full rounded-md px-3 py-2 text-base field-input"
              />
            </label>

            {error && <p className="mb-4 rounded-md p-3 text-sm error-banner">{error}</p>}

            <div className="flex gap-2">
              <button
                type="button"
                disabled={enviando}
                onClick={() => setMostrarResumen(false)}
                className="flex-1 rounded-md py-2.5 text-sm font-bold uppercase tracking-wide surface-muted text-label disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={enviando || itemsCarrito.length === 0}
                className="flex-1 rounded-md py-2.5 text-sm font-bold uppercase tracking-wide btn-primary disabled:opacity-50"
              >
                {enviando ? 'Enviando...' : 'Confirmar pedido'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
