import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface RangoFechas {
  desde?: string;
  hasta?: string;
}

interface AcumuladoRoi {
  mes: string;
  margen: number;
  costoTotal: number;
}

@Injectable()
export class ReportesService {
  constructor(private readonly prisma: PrismaService) {}

  private itemsVendidos({ desde, hasta }: RangoFechas) {
    return this.prisma.pedidoItem.findMany({
      where: {
        precioUnitario: { not: null },
        costoUnitarioAlMomento: { not: null },
        pedido: {
          estado: { not: 'RECHAZADO' },
          fecha: {
            gte: desde ? new Date(desde) : undefined,
            lte: hasta ? new Date(hasta) : undefined,
          },
        },
      },
      include: { producto: true, pedido: { include: { cliente: true } } },
    });
  }

  async roiPorProducto(rango: RangoFechas) {
    const items = await this.itemsVendidos(rango);
    const porClave = new Map<string, AcumuladoRoi & { productoId: string; producto: string }>();

    for (const item of items) {
      const mes = item.pedido.fecha.toISOString().slice(0, 7);
      const margen = (item.precioUnitario! - item.costoUnitarioAlMomento!) * item.cantidad;
      const costoTotal = item.costoUnitarioAlMomento! * item.cantidad;
      const clave = `${item.productoId}|${mes}`;

      const actual = porClave.get(clave);
      if (actual) {
        actual.margen += margen;
        actual.costoTotal += costoTotal;
      } else {
        porClave.set(clave, { productoId: item.productoId, producto: item.producto.nombre, mes, margen, costoTotal });
      }
    }

    return Array.from(porClave.values())
      .map((r) => ({ ...r, roiPct: r.costoTotal > 0 ? (r.margen / r.costoTotal) * 100 : null }))
      .sort((a, b) => a.mes.localeCompare(b.mes));
  }

  async roiPorCliente(rango: RangoFechas) {
    const items = await this.itemsVendidos(rango);
    const porClave = new Map<string, AcumuladoRoi & { clienteId: string; cliente: string }>();

    for (const item of items) {
      const mes = item.pedido.fecha.toISOString().slice(0, 7);
      const margen = (item.precioUnitario! - item.costoUnitarioAlMomento!) * item.cantidad;
      const costoTotal = item.costoUnitarioAlMomento! * item.cantidad;
      const clave = `${item.pedido.clienteId}|${mes}`;

      const actual = porClave.get(clave);
      if (actual) {
        actual.margen += margen;
        actual.costoTotal += costoTotal;
      } else {
        porClave.set(clave, {
          clienteId: item.pedido.clienteId,
          cliente: item.pedido.cliente.nombre,
          mes,
          margen,
          costoTotal,
        });
      }
    }

    return Array.from(porClave.values())
      .map((r) => ({ ...r, roiPct: r.costoTotal > 0 ? (r.margen / r.costoTotal) * 100 : null }))
      .sort((a, b) => a.mes.localeCompare(b.mes));
  }
}
