import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { OrigenPedido } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CalendarService } from '../calendar/calendar.service';
import { CreatePedidoDto, PedidoItemDto } from './dto/create-pedido.dto';
import { CrearPedidoClienteDto } from './dto/crear-pedido-cliente.dto';

@Injectable()
export class PedidosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calendar: CalendarService,
  ) {}

  findAll() {
    return this.prisma.pedido.findMany({
      orderBy: { fecha: 'desc' },
      include: { cliente: true, items: { include: { producto: true } } },
    });
  }

  misPedidos(clienteId: string) {
    return this.prisma.pedido.findMany({
      where: { clienteId },
      orderBy: { fecha: 'desc' },
      include: { cliente: true, items: { include: { producto: true } } },
    });
  }

  async findOne(id: string) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id },
      include: { cliente: true, items: { include: { producto: true } } },
    });
    if (!pedido) throw new NotFoundException('Pedido no encontrado');
    return pedido;
  }

  create(dto: CreatePedidoDto) {
    return this.crearPedido(dto.clienteId, dto.items, dto.direccion, dto.fechaEntrega, 'MANUAL');
  }

  async crearMio(clienteId: string, dto: CrearPedidoClienteDto) {
    return this.crearPedido(clienteId, dto.items, dto.direccion, dto.fechaEntrega, 'CLIENTE');
  }

  private async crearPedido(
    clienteId: string,
    items: PedidoItemDto[],
    direccion: string | undefined,
    fechaEntrega: string | undefined,
    origen: OrigenPedido,
  ) {
    const cliente = await this.prisma.cliente.findUnique({ where: { id: clienteId } });
    if (!cliente) throw new NotFoundException('Cliente no encontrado');

    const productos = await this.prisma.producto.findMany({
      where: { id: { in: items.map((i) => i.productoId) } },
    });

    const productosPorId = new Map(productos.map((p) => [p.id, p]));

    for (const item of items) {
      const producto = productosPorId.get(item.productoId);
      if (!producto) {
        throw new NotFoundException(`Producto ${item.productoId} no encontrado`);
      }
      if (item.cantidad > producto.stockActual) {
        throw new BadRequestException(
          `Stock insuficiente de ${producto.nombre}: pedido ${item.cantidad} ${producto.unidad}, disponible ${producto.stockActual} ${producto.unidad}`,
        );
      }
    }

    const monto = items.reduce((total, item) => {
      const producto = productosPorId.get(item.productoId)!;
      return total + item.cantidad * (producto.precio ?? 0);
    }, 0);

    const pedido = await this.prisma.$transaction(async (tx) => {
      const pedido = await tx.pedido.create({
        data: {
          clienteId,
          direccion,
          monto,
          origen,
          fechaEntrega: fechaEntrega ? new Date(fechaEntrega) : undefined,
          items: {
            create: items.map((item) => ({
              productoId: item.productoId,
              cantidad: item.cantidad,
              unidad: productosPorId.get(item.productoId)!.unidad,
            })),
          },
        },
        include: { cliente: true, items: { include: { producto: true } } },
      });

      for (const item of items) {
        const producto = productosPorId.get(item.productoId)!;
        const actualizado = await tx.producto.update({
          where: { id: item.productoId },
          data: { stockActual: { decrement: item.cantidad } },
        });

        await tx.movimientoStock.create({
          data: {
            productoId: item.productoId,
            tipo: 'VENTA',
            cantidad: -item.cantidad,
            pedidoId: pedido.id,
          },
        });

        if (actualizado.stockActual < actualizado.stockMinimo) {
          await tx.notificacion.create({
            data: {
              tipo: 'STOCK_BAJO',
              productoId: item.productoId,
              mensaje: `Stock bajo: ${producto.nombre} quedó en ${actualizado.stockActual} ${actualizado.unidad} (mínimo ${actualizado.stockMinimo}).`,
            },
          });
        }
      }

      await tx.notificacion.create({
        data: {
          tipo: 'PEDIDO_NUEVO',
          mensaje: `Nuevo pedido de ${cliente.nombre} (${items.length} producto${items.length > 1 ? 's' : ''}).`,
        },
      });

      return pedido;
    });

    if (pedido.fechaEntrega) {
      const eventId = await this.crearEventoCalendar(pedido);
      if (eventId) {
        await this.prisma.pedido.update({ where: { id: pedido.id }, data: { googleEventId: eventId } });
        pedido.googleEventId = eventId;
      }
    }

    return pedido;
  }

  async updateEstado(id: string, estado: 'CONFIRMADO' | 'ENTREGADO') {
    const pedido = await this.findOne(id);

    if (estado === 'ENTREGADO' && pedido.googleEventId) {
      await this.calendar.eliminarEvento(pedido.googleEventId);
    }

    let googleEventId = pedido.googleEventId;
    if (estado === 'CONFIRMADO' && pedido.estado === 'ENTREGADO' && pedido.fechaEntrega) {
      googleEventId = await this.crearEventoCalendar(pedido);
    }

    return this.prisma.pedido.update({
      where: { id },
      data: { estado, googleEventId: estado === 'ENTREGADO' ? null : googleEventId },
      include: { cliente: true, items: { include: { producto: true } } },
    });
  }

  private async crearEventoCalendar(pedido: {
    id: string;
    cliente: { nombre: string; telefono: string | null };
    items: { cantidad: number; unidad: string; producto: { nombre: string } }[];
    direccion: string | null;
    monto: number | null;
    fechaEntrega: Date | null;
  }) {
    if (!pedido.fechaEntrega) return null;
    const listaProductos = pedido.items
      .map((it) => `- ${it.cantidad} ${it.unidad} ${it.producto.nombre}`)
      .join('\n');
    const descripcion = [
      `Cliente: ${pedido.cliente.nombre}${pedido.cliente.telefono ? ' (' + pedido.cliente.telefono + ')' : ''}`,
      pedido.direccion ? `Dirección: ${pedido.direccion}` : null,
      pedido.monto ? `Monto: $${pedido.monto}` : null,
      '',
      'Productos:',
      listaProductos,
    ]
      .filter((line) => line !== null)
      .join('\n');

    return this.calendar.crearEvento({
      titulo: `Entregar pedido — ${pedido.cliente.nombre}`,
      descripcion,
      fechaEntrega: pedido.fechaEntrega,
    });
  }
}
