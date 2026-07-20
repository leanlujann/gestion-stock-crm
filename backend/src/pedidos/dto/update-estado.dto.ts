import { IsIn } from 'class-validator';

export class UpdateEstadoDto {
  @IsIn(['CONFIRMADO', 'ENTREGADO'])
  estado!: 'CONFIRMADO' | 'ENTREGADO';
}
