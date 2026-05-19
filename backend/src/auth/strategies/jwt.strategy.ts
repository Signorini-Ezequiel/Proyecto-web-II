import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { EnvironmentVariables } from '../../config/env.validation';
import { UsersService } from '../../users/users.service';
import type { AuthUser } from '../types/auth-user.type';
import type { JwtPayload } from '../types/jwt-payload.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService<EnvironmentVariables, true>,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET', { infer: true }),
    });
  }

  validate(payload: JwtPayload): AuthUser {
    if (typeof payload.sub !== 'number') {
      throw new UnauthorizedException('Invalid token subject');
    }

    const user = this.usersService.findById(payload.sub);
    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
