import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { RolUsuario } from '@prisma/client';

export interface UsuarioActual {
  sub: string;
  username: string;
  role: RolUsuario;
  clienteId: string | null;
}

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): UsuarioActual => {
  return ctx.switchToHttp().getRequest().usuario;
});
