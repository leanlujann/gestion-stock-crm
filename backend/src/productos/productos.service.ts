import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';

@Injectable()
export class ProductosService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.producto.findMany({
      include: { proveedor: true },
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: string) {
    const producto = await this.prisma.producto.findUnique({
      where: { id },
      include: {
        proveedor: true,
        movimientos: { orderBy: { fecha: 'desc' }, take: 20 },
      },
    });
    if (!producto) throw new NotFoundException('Producto no encontrado');
    return producto;
  }

  create(dto: CreateProductoDto) {
    return this.prisma.producto.create({
      data: {
        nombre: dto.nombre,
        unidad: dto.unidad,
        stockActual: dto.stockActual ?? 0,
        stockMinimo: dto.stockMinimo ?? 50,
        fechaVencimiento: dto.fechaVencimiento ? new Date(dto.fechaVencimiento) : undefined,
        notas: dto.notas,
        proveedorId: dto.proveedorId,
      },
    });
  }

  async update(id: string, dto: UpdateProductoDto) {
    await this.findOne(id);
    return this.prisma.producto.update({
      where: { id },
      data: {
        ...dto,
        fechaVencimiento: dto.fechaVencimiento ? new Date(dto.fechaVencimiento) : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.producto.delete({ where: { id } });
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
