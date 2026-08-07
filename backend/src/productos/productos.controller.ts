import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ProductosService } from './productos.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { CreateLoteDto } from './dto/create-lote.dto';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, type UsuarioActual } from '../auth/current-user.decorator';

@Roles('STAFF')
@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  @Get()
  findAll() {
    return this.productosService.findAll();
  }

  @Roles('STAFF', 'CLIENTE')
  @Get('catalogo')
  catalogo() {
    return this.productosService.catalogo();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productosService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateProductoDto) {
    return this.productosService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductoDto) {
    return this.productosService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productosService.remove(id);
  }

  @Patch(':id/archivar')
  archive(@Param('id') id: string) {
    return this.productosService.archive(id);
  }

  @Post(':id/ajustar-stock')
  adjustStock(@Param('id') id: string, @Body() dto: AdjustStockDto, @CurrentUser() usuario: UsuarioActual) {
    return this.productosService.adjustStock(id, dto.delta, usuario.sub);
  }

  @Post(':id/lotes')
  addLote(@Param('id') id: string, @Body() dto: CreateLoteDto, @CurrentUser() usuario: UsuarioActual) {
    return this.productosService.addLote(id, dto, usuario.sub);
  }

  @Delete(':id/lotes/:loteId')
  removeLote(@Param('id') id: string, @Param('loteId') loteId: string) {
    return this.productosService.removeLote(id, loteId);
  }
}
