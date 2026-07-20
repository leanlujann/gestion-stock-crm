import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompraDto } from './dto/create-compra.dto';

@Injectable()
export class ComprasService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.compra.findMany({
      orderBy: { fecha: 'desc' },
      include: { proveedor: true, items: { include: { producto: true } } },
    });
  }

  async findOne(id: string) {
    const compra = await this.prisma.compra.findUnique({
      where: { id },
      include: { proveedor: true, items: { include: { producto: true } } },
    });
    if (!compra) throw new NotFoundException('Compra no encontrada');
    return compra;
  }

  async create(dto: CreateCompraDto) {
    const proveedor = await this.prisma.proveedor.findUnique({ where: { id: dto.proveedorId } });
    if (!proveedor) throw new NotFoundException('Proveedor no encontrado');

    const productos = await this.prisma.producto.findMany({
      where: { id: { in: dto.items.map((i) => i.productoId) } },
    });
    const productosPorId = new Map(productos.map((p) => [p.id, p]));

    for (const item of dto.items) {
      if (!productosPorId.has(item.productoId)) {
        throw new NotFoundException(`Producto ${item.productoId} no encontrado`);
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const compra = await tx.compra.create({
        data: {
          proveedorId: dto.proveedorId,
          items: {
            create: dto.items.map((item) => ({
              productoId: item.productoId,
              cantidad: item.cantidad,
              unidad: productosPorId.get(item.productoId)!.unidad,
            })),
          },
        },
        include: { proveedor: true, items: { include: { producto: true } } },
      });

      for (const item of dto.items) {
        await tx.producto.update({
          where: { id: item.productoId },
          data: { stockActual: { increment: item.cantidad } },
        });

        await tx.movimientoStock.create({
          data: {
            productoId: item.productoId,
            tipo: 'COMPRA',
            cantidad: item.cantidad,
            compraId: compra.id,
          },
        });
      }

      await tx.notificacion.create({
        data: {
          tipo: 'COMPRA_REGISTRADA',
          mensaje: `Compra registrada a ${proveedor.nombre} (${dto.items.length} producto${dto.items.length > 1 ? 's' : ''}).`,
        },
      });

      return compra;
    });
  }
}
