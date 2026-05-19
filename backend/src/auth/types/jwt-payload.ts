import { UserRole } from '../../common/types/user-role';

export interface JwtPayload {
  sub: number;
  email: string;
  role: UserRole;
}
