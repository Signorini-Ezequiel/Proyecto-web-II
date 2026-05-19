import { UserRole } from '../../common/types/user-role';

export interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
}
