import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { Unidad } from '@prisma/client';

export class CreateProductoDto {
  @IsString()
  @MinLength(1)
  nombre!: string;

  @IsEnum(Unidad)
  unidad!: Unidad;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stockActual?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stockMinimo?: number;

  @IsOptional()
  @IsDateString()
  fechaVencimiento?: string;

  @IsOptional()
  @IsString()
  notas?: string;

  @IsOptional()
  @IsString()
  proveedorId?: string;
}
