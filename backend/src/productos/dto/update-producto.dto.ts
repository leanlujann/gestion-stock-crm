import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateProductoDto } from './create-producto.dto';

class ProductoBaseDto extends OmitType(CreateProductoDto, [
  'fechaVencimiento',
  'notas',
  'stockActual',
] as const) {}

export class UpdateProductoDto extends PartialType(ProductoBaseDto) {}
