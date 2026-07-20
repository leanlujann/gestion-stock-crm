export type Unidad = 'KG' | 'LT' | 'UN'

export interface Proveedor {
  id: string
  nombre: string
  telefono: string | null
  notas: string | null
  createdAt: string
  updatedAt: string
  productos?: Producto[]
  compras?: Compra[]
}

export interface Producto {
  id: string
  nombre: string
  unidad: Unidad
  stockActual: number
  stockMinimo: number
  fechaVencimiento: string | null
  notas: string | null
  proveedorId: string | null
  proveedor?: Proveedor | null
  createdAt: string
  updatedAt: string
  movimientos?: MovimientoStock[]
}

export interface Cliente {
  id: string
  nombre: string
  telefono: string | null
  notas: string | null
  createdAt: string
  updatedAt: string
  pedidos?: Pedido[]
}

export interface MovimientoStock {
  id: string
  productoId: string
  tipo: 'VENTA' | 'COMPRA' | 'AJUSTE'
  cantidad: number
  pedidoId: string | null
  compraId: string | null
  fecha: string
}

export interface PedidoItem {
  id: string
  pedidoId: string
  productoId: string
  producto: Producto
  cantidad: number
  unidad: Unidad
}

export interface Pedido {
  id: string
  clienteId: string
  cliente: Cliente
  fecha: string
  estado: 'PENDIENTE_CONFIRMACION' | 'CONFIRMADO' | 'ENTREGADO' | 'RECHAZADO'
  origen: 'MANUAL' | 'WHATSAPP'
  items: PedidoItem[]
}

export interface CompraItem {
  id: string
  compraId: string
  productoId: string
  producto: Producto
  cantidad: number
  unidad: Unidad
}

export interface Compra {
  id: string
  proveedorId: string
  proveedor: Proveedor
  fecha: string
  estado: string
  origen: string
  items: CompraItem[]
}

export interface Notificacion {
  id: string
  tipo: 'STOCK_BAJO' | 'PEDIDO_NUEVO' | 'COMPRA_REGISTRADA'
  productoId: string | null
  producto: Producto | null
  mensaje: string
  leida: boolean
  createdAt: string
}
