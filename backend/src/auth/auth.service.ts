import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { toPublicUser } from '../users/entities/user.entity';
import type { PublicUser } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import type { JwtPayload } from './types/jwt-payload';

export interface AuthResult {
  ok: true;
  user: PublicUser;
  accessToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: CreateUserDto): Promise<AuthResult> {
    const user = await this.usersService.create(dto);
    return this.buildAuthResult(user);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.usersService.findPrivateByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Email o contrasena incorrectos.');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Email o contrasena incorrectos.');
    }

    return this.buildAuthResult(toPublicUser(user));
  }

  private async buildAuthResult(user: PublicUser): Promise<AuthResult> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      ok: true,
      user,
      accessToken: await this.jwtService.signAsync(payload),
    };
  }
}
