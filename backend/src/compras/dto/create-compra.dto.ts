import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsNumber,
  IsPositive,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CompraItemDto {
  @IsString()
  @MinLength(1)
  productoId!: string;

  @IsNumber()
  @IsPositive()
  cantidad!: number;
}

export class CreateCompraDto {
  @IsString()
  @MinLength(1)
  proveedorId!: string;

  @ValidateNested({ each: true })
  @Type(() => CompraItemDto)
  @ArrayMinSize(1)
  items!: CompraItemDto[];
}
