import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type { RolUsuario } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async estado() {
    const count = await this.prisma.usuario.count();
    return { tieneUsuarios: count > 0 };
  }

  async register(dto: RegisterDto) {
    const existente = await this.prisma.usuario.findUnique({ where: { username: dto.username } });
    if (existente) {
      throw new ConflictException('Ese usuario ya existe.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const usuario = await this.prisma.$transaction(async (tx) => {
      const cliente = await tx.cliente.create({
        data: { nombre: dto.nombre, telefono: dto.telefono, direccion: dto.direccion },
      });
      return tx.usuario.create({
        data: {
          username: dto.username,
          passwordHash,
          role: 'CLIENTE',
          clienteId: cliente.id,
        },
      });
    });

    return this.firmarToken(usuario.id, usuario.username, usuario.role, usuario.clienteId);
  }

  async login(dto: LoginDto) {
    const usuario = await this.prisma.usuario.findUnique({ where: { username: dto.username } });
    if (!usuario) throw new UnauthorizedException('Usuario o contraseña incorrectos');

    const valido = await bcrypt.compare(dto.password, usuario.passwordHash);
    if (!valido) throw new UnauthorizedException('Usuario o contraseña incorrectos');

    return this.firmarToken(usuario.id, usuario.username, usuario.role, usuario.clienteId);
  }

  private firmarToken(sub: string, username: string, role: RolUsuario, clienteId: string | null) {
    const token = this.jwtService.sign({ sub, username, role, clienteId });
    return { token, username, role, clienteId };
  }
}
