import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ComprasService } from './compras.service';
import { CreateCompraDto } from './dto/create-compra.dto';
import { Roles } from '../auth/roles.decorator';

@Roles('STAFF')
@Controller('compras')
export class ComprasController {
  constructor(private readonly comprasService: ComprasService) {}

  @Get()
  findAll() {
    return this.comprasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.comprasService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCompraDto) {
    return this.comprasService.create(dto);
  }
}
