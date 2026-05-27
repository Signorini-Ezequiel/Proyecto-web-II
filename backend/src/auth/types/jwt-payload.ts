import { UserRole } from '../../common/types/user-role';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}
