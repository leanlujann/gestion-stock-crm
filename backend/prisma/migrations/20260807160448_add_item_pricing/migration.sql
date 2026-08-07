-- AlterTable
ALTER TABLE "CompraItem" ADD COLUMN "costoUnitario" REAL;

-- AlterTable
ALTER TABLE "PedidoItem" ADD COLUMN "costoUnitarioAlMomento" REAL;
ALTER TABLE "PedidoItem" ADD COLUMN "precioUnitario" REAL;

-- AlterTable
ALTER TABLE "Producto" ADD COLUMN "costo" REAL;
