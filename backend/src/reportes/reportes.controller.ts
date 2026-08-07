import { Controller, Get, Query } from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { Roles } from '../auth/roles.decorator';

@Roles('STAFF')
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('roi-productos')
  roiProductos(@Query('desde') desde?: string, @Query('hasta') hasta?: string) {
    return this.reportesService.roiPorProducto({ desde, hasta });
  }

  @Get('roi-clientes')
  roiClientes(@Query('desde') desde?: string, @Query('hasta') hasta?: string) {
    return this.reportesService.roiPorCliente({ desde, hasta });
  }
}
