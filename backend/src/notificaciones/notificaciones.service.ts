import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificacionesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.notificacion.findMany({
      orderBy: { createdAt: 'desc' },
      include: { producto: true },
      take: 100,
    });
  }

  countNoLeidas() {
    return this.prisma.notificacion.count({ where: { leida: false } });
  }

  async marcarLeida(id: string) {
    const notif = await this.prisma.notificacion.findUnique({ where: { id } });
    if (!notif) throw new NotFoundException('Notificación no encontrada');
    return this.prisma.notificacion.update({ where: { id }, data: { leida: true } });
  }

  marcarTodasLeidas() {
    return this.prisma.notificacion.updateMany({ where: { leida: false }, data: { leida: true } });
  }
}
