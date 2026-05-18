import type { UserRole } from '@prisma/client';

export type JwtTokenType = 'access' | 'refresh';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  tokenType: JwtTokenType;
}
