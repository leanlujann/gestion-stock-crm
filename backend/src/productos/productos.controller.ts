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

@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  @Get()
  findAll() {
    return this.productosService.findAll();
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
  adjustStock(@Param('id') id: string, @Body() dto: AdjustStockDto) {
    return this.productosService.adjustStock(id, dto.delta);
  }

  @Post(':id/lotes')
  addLote(@Param('id') id: string, @Body() dto: CreateLoteDto) {
    return this.productosService.addLote(id, dto);
  }

  @Delete(':id/lotes/:loteId')
  removeLote(@Param('id') id: string, @Param('loteId') loteId: string) {
    return this.productosService.removeLote(id, loteId);
  }
}
