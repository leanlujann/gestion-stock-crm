import { Controller, Get, Param, Patch } from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service';
import { Roles } from '../auth/roles.decorator';

@Roles('STAFF')
@Controller('notificaciones')
export class NotificacionesController {
  constructor(private readonly notificacionesService: NotificacionesService) {}

  @Get()
  findAll() {
    return this.notificacionesService.findAll();
  }

  @Get('no-leidas/count')
  countNoLeidas() {
    return this.notificacionesService.countNoLeidas();
  }

  @Patch(':id/leida')
  marcarLeida(@Param('id') id: string) {
    return this.notificacionesService.marcarLeida(id);
  }

  @Patch('leer-todas')
  marcarTodasLeidas() {
    return this.notificacionesService.marcarTodasLeidas();
  }
}
