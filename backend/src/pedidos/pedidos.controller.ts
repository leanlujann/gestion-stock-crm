import { BadRequestException, Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { PedidosService } from './pedidos.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdateEstadoDto } from './dto/update-estado.dto';
import { CrearPedidoClienteDto } from './dto/crear-pedido-cliente.dto';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, type UsuarioActual } from '../auth/current-user.decorator';

@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @Roles('STAFF')
  @Get()
  findAll() {
    return this.pedidosService.findAll();
  }

  @Roles('CLIENTE')
  @Get('mios')
  misPedidos(@CurrentUser() usuario: UsuarioActual) {
    if (!usuario.clienteId) throw new BadRequestException('Esta cuenta no tiene un cliente vinculado');
    return this.pedidosService.misPedidos(usuario.clienteId);
  }

  @Roles('CLIENTE')
  @Post('mio')
  crearMio(@CurrentUser() usuario: UsuarioActual, @Body() dto: CrearPedidoClienteDto) {
    if (!usuario.clienteId) throw new BadRequestException('Esta cuenta no tiene un cliente vinculado');
    return this.pedidosService.crearMio(usuario.clienteId, dto);
  }

  @Roles('STAFF')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pedidosService.findOne(id);
  }

  @Roles('STAFF')
  @Post()
  create(@Body() dto: CreatePedidoDto) {
    return this.pedidosService.create(dto);
  }

  @Roles('STAFF')
  @Patch(':id/estado')
  updateEstado(@Param('id') id: string, @Body() dto: UpdateEstadoDto) {
    return this.pedidosService.updateEstado(id, dto.estado);
  }
}
