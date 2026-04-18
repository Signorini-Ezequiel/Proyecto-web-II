export type UserRole = "buyer" | "seller";

export type MockUser = {
  id: number;
  name: string;
  email: string;
  password: string;
  role: "buyer" | "seller";
  avatarUrl: string | null;
};

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: "buyer" | "seller";
  avatarUrl: string | null;
};

export type LoginResult =
  | { ok: true; user: SessionUser }
  | { ok: false; message: string };

export type RegisterResult =
| { ok: true; user: SessionUser }
| { ok: false; message: string };
