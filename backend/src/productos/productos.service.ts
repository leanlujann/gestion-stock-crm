import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { CreateLoteDto } from './dto/create-lote.dto';

@Injectable()
export class ProductosService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.producto.findMany({
      where: { activo: true },
      include: {
        proveedor: true,
        lotes: { orderBy: { fechaVencimiento: 'asc' } },
      },
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: string) {
    const producto = await this.prisma.producto.findUnique({
      where: { id },
      include: {
        proveedor: true,
        lotes: { orderBy: { fechaVencimiento: 'asc' } },
        movimientos: { orderBy: { fecha: 'desc' }, take: 20 },
      },
    });
    if (!producto) throw new NotFoundException('Producto no encontrado');
    return producto;
  }

  create(dto: CreateProductoDto) {
    const stockActual = dto.stockActual ?? 0;
    const crearLoteInicial = Boolean(dto.fechaVencimiento || dto.notas);

    return this.prisma.producto.create({
      data: {
        nombre: dto.nombre,
        unidad: dto.unidad,
        stockActual,
        stockMinimo: dto.stockMinimo ?? 50,
        precio: dto.precio,
        proveedorId: dto.proveedorId,
        lotes: crearLoteInicial
          ? {
              create: {
                cantidad: stockActual,
                fechaVencimiento: dto.fechaVencimiento ? new Date(dto.fechaVencimiento) : undefined,
                notas: dto.notas,
              },
            }
          : undefined,
      },
      include: { lotes: true },
    });
  }

  async update(id: string, dto: UpdateProductoDto) {
    await this.findOne(id);
    return this.prisma.producto.update({ where: { id }, data: dto });
  }

  async archive(id: string) {
    await this.findOne(id);
    return this.prisma.producto.update({ where: { id }, data: { activo: false } });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.$transaction(async (tx) => {
      await tx.notificacion.deleteMany({ where: { productoId: id } });
      await tx.movimientoStock.deleteMany({ where: { productoId: id } });
      await tx.pedidoItem.deleteMany({ where: { productoId: id } });
      await tx.compraItem.deleteMany({ where: { productoId: id } });
      return tx.producto.delete({ where: { id } });
    });
  }

  async addLote(id: string, dto: CreateLoteDto) {
    const producto = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      const lote = await tx.lote.create({
        data: {
          productoId: id,
          cantidad: dto.cantidad,
          fechaVencimiento: dto.fechaVencimiento ? new Date(dto.fechaVencimiento) : undefined,
          notas: dto.notas,
        },
      });

      await tx.producto.update({
        where: { id },
        data: { stockActual: { increment: dto.cantidad } },
      });

      await tx.movimientoStock.create({
        data: { productoId: id, tipo: 'AJUSTE', cantidad: dto.cantidad },
      });

      return { ...lote, producto: producto.nombre };
    });
  }

  async removeLote(id: string, loteId: string) {
    const lote = await this.prisma.lote.findUnique({ where: { id: loteId } });
    if (!lote || lote.productoId !== id) throw new NotFoundException('Lote no encontrado');

    return this.prisma.$transaction(async (tx) => {
      await tx.lote.delete({ where: { id: loteId } });
      return tx.producto.update({
        where: { id },
        data: { stockActual: { decrement: lote.cantidad } },
      });
    });
  }

  async adjustStock(id: string, delta: number) {
    const producto = await this.findOne(id);
    const nuevoStock = producto.stockActual + delta;
    if (nuevoStock < 0) {
      throw new NotFoundException('El ajuste dejaría el stock en negativo');
    }

    return this.prisma.$transaction(async (tx) => {
      const actualizado = await tx.producto.update({
        where: { id },
        data: { stockActual: nuevoStock },
      });

      await tx.movimientoStock.create({
        data: { productoId: id, tipo: 'AJUSTE', cantidad: delta },
      });

      if (actualizado.stockActual < actualizado.stockMinimo) {
        await tx.notificacion.create({
          data: {
            tipo: 'STOCK_BAJO',
            productoId: id,
            mensaje: `Stock bajo: ${actualizado.nombre} quedó en ${actualizado.stockActual} ${actualizado.unidad} (mínimo ${actualizado.stockMinimo}).`,
          },
        });
      }

      return actualizado;
    });
  }
}
