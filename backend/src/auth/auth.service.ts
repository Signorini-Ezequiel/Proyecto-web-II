import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import type { EnvironmentVariables } from '../config/env.validation';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthResponseDto } from './dto/auth-response.dto';
import type { LoginDto } from './dto/login.dto';
import type { RefreshTokenDto } from './dto/refresh-token.dto';
import type { RegisterDto } from './dto/register.dto';
import type { AuthUser } from './types/auth-user.type';
import type { JwtPayload } from './types/jwt-payload.type';

type SafeUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const USER_SAFE_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatar: true,
  createdAt: true,
  updatedAt: true,
} as const;

const BCRYPT_SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const email = registerDto.email.toLowerCase().trim();

    if (registerDto.role === UserRole.ADMIN) {
      throw new BadRequestException('Admin users cannot self-register');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser !== null) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(
      registerDto.password,
      BCRYPT_SALT_ROUNDS,
    );

    const user = await this.prisma.user.create({
      data: {
        name: registerDto.name.trim(),
        email,
        password: passwordHash,
        role: registerDto.role ?? UserRole.BUYER,
        avatar: registerDto.avatar,
      },
      select: USER_SAFE_SELECT,
    });

    return this.issueAuthResponse(user);
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const email = loginDto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        ...USER_SAFE_SELECT,
        password: true,
      },
    });

    if (user === null) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueAuthResponse(this.toSafeUser(user));
  }

  async refreshTokens(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<AuthResponseDto> {
    const payload = await this.verifyRefreshToken(refreshTokenDto.refreshToken);
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        ...USER_SAFE_SELECT,
        refreshTokenHash: true,
      },
    });

    if (user === null || user.refreshTokenHash === null) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const refreshTokenMatches = await bcrypt.compare(
      refreshTokenDto.refreshToken,
      user.refreshTokenHash,
    );

    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.issueAuthResponse(this.toSafeUser(user));
  }

  async logout(user: AuthUser): Promise<{ success: boolean }> {
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: null },
      select: { id: true },
    });

    return { success: true };
  }

  private async issueAuthResponse(user: SafeUser): Promise<AuthResponseDto> {
    const [accessToken, refreshToken] = await Promise.all([
      this.signToken(user, 'access'),
      this.signToken(user, 'refresh'),
    ]);

    const refreshTokenHash = await bcrypt.hash(
      refreshToken,
      BCRYPT_SALT_ROUNDS,
    );

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash },
      select: { id: true },
    });

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  private toSafeUser(user: SafeUser): SafeUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private async signToken(
    user: SafeUser,
    tokenType: JwtPayload['tokenType'],
  ): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tokenType,
    };
    const expiresIn = this.configService.get(
      tokenType === 'access'
        ? 'JWT_ACCESS_EXPIRES_IN'
        : 'JWT_REFRESH_EXPIRES_IN',
      { infer: true },
    );

    return this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_SECRET', { infer: true }),
      expiresIn,
    });
  }

  private async verifyRefreshToken(refreshToken: string): Promise<JwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        refreshToken,
        {
          secret: this.configService.get('JWT_SECRET', { infer: true }),
        },
      );

      if (payload.tokenType !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
