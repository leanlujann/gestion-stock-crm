import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
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
    const count = await this.prisma.usuario.count();
    if (count > 0) {
      throw new ConflictException('Ya existe un usuario. Pedile a un administrador que te cree una cuenta.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const usuario = await this.prisma.usuario.create({
      data: { username: dto.username, passwordHash },
    });

    return this.firmarToken(usuario.id, usuario.username);
  }

  async login(dto: LoginDto) {
    const usuario = await this.prisma.usuario.findUnique({ where: { username: dto.username } });
    if (!usuario) throw new UnauthorizedException('Usuario o contraseña incorrectos');

    const valido = await bcrypt.compare(dto.password, usuario.passwordHash);
    if (!valido) throw new UnauthorizedException('Usuario o contraseña incorrectos');

    return this.firmarToken(usuario.id, usuario.username);
  }

  private firmarToken(sub: string, username: string) {
    const token = this.jwtService.sign({ sub, username });
    return { token, username };
  }
}
