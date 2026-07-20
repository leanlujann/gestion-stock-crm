import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsNumber,
  IsPositive,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class PedidoItemDto {
  @IsString()
  @MinLength(1)
  productoId!: string;

  @IsNumber()
  @IsPositive()
  cantidad!: number;
}

export class CreatePedidoDto {
  @IsString()
  @MinLength(1)
  clienteId!: string;

  @ValidateNested({ each: true })
  @Type(() => PedidoItemDto)
  @ArrayMinSize(1)
  items!: PedidoItemDto[];
}
