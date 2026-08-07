import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api } from '../api/client'
import type { RoiCliente, RoiProducto } from '../api/types'
import { useTheme } from '../theme'

function fmtMes(mes: string) {
  const [anio, mesNum] = mes.split('-')
  const nombre = new Date(Number(anio), Number(mesNum) - 1, 1).toLocaleDateString('es-AR', { month: 'short' })
  return `${nombre} ${anio}`
}

function fmtMoney(n: number) {
  return `$${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`
}

interface RankItem {
  id: string
  nombre: string
  margen: number
  costoTotal: number
}

function ranking(items: { id: string; nombre: string; margen: number; costoTotal: number }[]): RankItem[] {
  const porId = new Map<string, RankItem>()
  for (const it of items) {
    const actual = porId.get(it.id)
    if (actual) {
      actual.margen += it.margen
      actual.costoTotal += it.costoTotal
    } else {
      porId.set(it.id, { ...it })
    }
  }
  return Array.from(porId.values()).sort((a, b) => b.margen - a.margen)
}

export function RoiPage() {
  const { theme } = useTheme()
  const [roiProductos, setRoiProductos] = useState<RoiProducto[]>([])
  const [roiClientes, setRoiClientes] = useState<RoiCliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [productoId, setProductoId] = useState('')
  const [clienteId, setClienteId] = useState('')

  useEffect(() => {
    Promise.all([api.get<RoiProducto[]>('/reportes/roi-productos'), api.get<RoiCliente[]>('/reportes/roi-clientes')])
      .then(([rp, rc]) => {
        setRoiProductos(rp)
        setRoiClientes(rc)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const lineColor = theme === 'dark' ? '#EDE6D6' : '#17140F'
  const areaColor = theme === 'dark' ? '#FBBF24' : '#D97706'

  const totalMargen = useMemo(() => roiProductos.reduce((t, r) => t + r.margen, 0), [roiProductos])
  const totalCosto = useMemo(() => roiProductos.reduce((t, r) => t + r.costoTotal, 0), [roiProductos])
  const roiPromedio = totalCosto > 0 ? (totalMargen / totalCosto) * 100 : null

  const rankingProductos = useMemo(
    () => ranking(roiProductos.map((r) => ({ id: r.productoId, nombre: r.producto, margen: r.margen, costoTotal: r.costoTotal }))),
    [roiProductos],
  )
  const rankingClientes = useMemo(
    () => ranking(roiClientes.map((r) => ({ id: r.clienteId, nombre: r.cliente, margen: r.margen, costoTotal: r.costoTotal }))),
    [roiClientes],
  )

  const curvaMensual = useMemo(() => {
    const porMes = new Map<string, number>()
    for (const r of roiProductos) porMes.set(r.mes, (porMes.get(r.mes) ?? 0) + r.margen)
    return Array.from(porMes.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, margen]) => ({ mes: fmtMes(mes), margen }))
  }, [roiProductos])

  const curvaProducto = useMemo(() => {
    if (!productoId) return []
    return roiProductos
      .filter((r) => r.productoId === productoId)
      .sort((a, b) => a.mes.localeCompare(b.mes))
      .map((r) => ({ mes: fmtMes(r.mes), margen: r.margen }))
  }, [roiProductos, productoId])

  const curvaCliente = useMemo(() => {
    if (!clienteId) return []
    return roiClientes
      .filter((r) => r.clienteId === clienteId)
      .sort((a, b) => a.mes.localeCompare(b.mes))
      .map((r) => ({ mes: fmtMes(r.mes), margen: r.margen }))
  }, [roiClientes, clienteId])

  if (loading) return <p className="p-4 text-center text-secondary">Cargando...</p>

  const sinDatos = roiProductos.length === 0 && roiClientes.length === 0

  return (
    <div className="mx-auto max-w-lg p-4">
      <h2 className="heading-display mb-4 text-lg">ROI</h2>

      {error && <p className="mb-3 rounded-md p-3 text-sm error-banner">{error}</p>}

      {sinDatos ? (
        <p className="rounded-lg p-4 text-sm surface text-secondary">
          Todavía no hay ventas con costo y precio registrados. En cuanto cargues una compra con costo unitario y
          confirmes un pedido de ese producto, el margen va a empezar a aparecer acá.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg p-3 surface">
              <p className="text-xs uppercase tracking-wide text-muted">Margen total</p>
              <p className="mt-1 text-lg font-bold text-heading">{fmtMoney(totalMargen)}</p>
            </div>
            <div className="rounded-lg p-3 surface">
              <p className="text-xs uppercase tracking-wide text-muted">ROI promedio</p>
              <p className="mt-1 text-lg font-bold text-heading">{roiPromedio != null ? `${roiPromedio.toFixed(1)}%` : '—'}</p>
            </div>
            <div className="rounded-lg p-3 surface">
              <p className="text-xs uppercase tracking-wide text-muted">Producto más rentable</p>
              <p className="mt-1 truncate text-sm font-bold text-heading">{rankingProductos[0]?.nombre ?? '—'}</p>
            </div>
            <div className="rounded-lg p-3 surface">
              <p className="text-xs uppercase tracking-wide text-muted">Cliente más rentable</p>
              <p className="mt-1 truncate text-sm font-bold text-heading">{rankingClientes[0]?.nombre ?? '—'}</p>
            </div>
          </div>

          <h3 className="heading-display mb-2 mt-6 text-sm">Margen mensual</h3>
          <div className="rounded-lg p-3 surface">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={curvaMensual}>
                <CartesianGrid strokeDasharray="3 3" stroke={lineColor} strokeOpacity={0.15} />
                <XAxis dataKey="mes" tick={{ fill: lineColor, fontSize: 12 }} axisLine={{ stroke: lineColor, strokeOpacity: 0.3 }} tickLine={false} />
                <YAxis tick={{ fill: lineColor, fontSize: 12 }} axisLine={false} tickLine={false} width={50} />
                <Tooltip
                  formatter={(v: number) => fmtMoney(v)}
                  contentStyle={{ background: theme === 'dark' ? '#16241F' : '#F6F2E9', border: `2px solid ${lineColor}`, borderRadius: 8 }}
                />
                <Area type="monotone" dataKey="margen" stroke={lineColor} fill={areaColor} fillOpacity={0.35} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <h3 className="heading-display mb-2 mt-6 text-sm">Por producto</h3>
          <div className="rounded-lg p-3 surface">
            <label className="mb-3 block text-sm font-medium text-label">
              Ver evolución de
              <select
                value={productoId}
                onChange={(e) => setProductoId(e.target.value)}
                className="mt-1 w-full rounded-md px-3 py-2 text-base field-input"
              >
                <option value="">Elegí un producto</option>
                {rankingProductos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </label>
            {productoId && (
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={curvaProducto}>
                  <CartesianGrid strokeDasharray="3 3" stroke={lineColor} strokeOpacity={0.15} />
                  <XAxis dataKey="mes" tick={{ fill: lineColor, fontSize: 12 }} axisLine={{ stroke: lineColor, strokeOpacity: 0.3 }} tickLine={false} />
                  <YAxis tick={{ fill: lineColor, fontSize: 12 }} axisLine={false} tickLine={false} width={50} />
                  <Tooltip
                    formatter={(v: number) => fmtMoney(v)}
                    contentStyle={{ background: theme === 'dark' ? '#16241F' : '#F6F2E9', border: `2px solid ${lineColor}`, borderRadius: 8 }}
                  />
                  <Line type="monotone" dataKey="margen" stroke={areaColor} strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}

            <ul className="mt-3 flex flex-col gap-1.5 text-sm">
              {rankingProductos.slice(0, 5).map((p, i) => (
                <li key={p.id} className="flex items-center justify-between rounded-md px-2.5 py-1.5 surface-muted">
                  <span className="text-secondary">
                    {i + 1}. {p.nombre}
                  </span>
                  <span className="font-bold text-heading">{fmtMoney(p.margen)}</span>
                </li>
              ))}
            </ul>
          </div>

          <h3 className="heading-display mb-2 mt-6 text-sm">Por cliente</h3>
          <div className="rounded-lg p-3 surface">
            <label className="mb-3 block text-sm font-medium text-label">
              Ver evolución de
              <select
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                className="mt-1 w-full rounded-md px-3 py-2 text-base field-input"
              >
                <option value="">Elegí un cliente</option>
                {rankingClientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </label>
            {clienteId && (
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={curvaCliente}>
                  <CartesianGrid strokeDasharray="3 3" stroke={lineColor} strokeOpacity={0.15} />
                  <XAxis dataKey="mes" tick={{ fill: lineColor, fontSize: 12 }} axisLine={{ stroke: lineColor, strokeOpacity: 0.3 }} tickLine={false} />
                  <YAxis tick={{ fill: lineColor, fontSize: 12 }} axisLine={false} tickLine={false} width={50} />
                  <Tooltip
                    formatter={(v: number) => fmtMoney(v)}
                    contentStyle={{ background: theme === 'dark' ? '#16241F' : '#F6F2E9', border: `2px solid ${lineColor}`, borderRadius: 8 }}
                  />
                  <Line type="monotone" dataKey="margen" stroke={areaColor} strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}

            <ul className="mt-3 flex flex-col gap-1.5 text-sm">
              {rankingClientes.slice(0, 5).map((c, i) => (
                <li key={c.id} className="flex items-center justify-between rounded-md px-2.5 py-1.5 surface-muted">
                  <span className="text-secondary">
                    {i + 1}. {c.nombre}
                  </span>
                  <span className="font-bold text-heading">{fmtMoney(c.margen)}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
