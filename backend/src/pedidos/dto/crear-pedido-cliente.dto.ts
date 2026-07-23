import { Type } from 'class-transformer';
import { ArrayMinSize, IsDateString, IsOptional, IsString, ValidateNested } from 'class-validator';
import { PedidoItemDto } from './create-pedido.dto';

export class CrearPedidoClienteDto {
  @ValidateNested({ each: true })
  @Type(() => PedidoItemDto)
  @ArrayMinSize(1)
  items!: PedidoItemDto[];

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsDateString()
  fechaEntrega!: string;
}
