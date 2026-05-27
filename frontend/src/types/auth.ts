export type UserRole = "buyer" | "seller";
export type PrismaUserRole = "BUYER" | "SELLER" | "ADMIN";

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SessionUser extends PublicUser {
  token?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto extends LoginDto {
  name: string;
  role: UserRole;
  avatarUrl?: string | null;
}

export interface UpdateUserDto {
  name?: string;
  avatarUrl?: string | null;
}

export interface UpdatePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthResponseDto {
  ok: true;
  user: PublicUser;
  accessToken: string;
}

export type LoginResult =
  | { ok: true; user: SessionUser }
  | { ok: false; message: string };

export type RegisterResult =
| { ok: true; user: SessionUser }
| { ok: false; message: string };
