import { UserRole } from '../../common/types/user-role';

export interface AuthUser {
  sub: string;
  id: string;
  email: string;
  role: UserRole;
}
