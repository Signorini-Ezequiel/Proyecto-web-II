import type { LoginResult, RegisterResult, SessionUser, UserRole } from "../types/auth";

const SESSION_KEY = "auto_market_session";
const BASE = "http://localhost:3000";

type AuthResponse = {
  ok: true;
  user: {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    avatarUrl: string | null;
  };
  accessToken: string;
};

type UpdateProfileInput = {
  name: string;
  avatarUrl: string | null;
};

type UpdateResult =
  | { ok: true; user: SessionUser }
  | { ok: false; message: string };

function saveSessionUser(user: SessionUser): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function getPasswordValidationMessage(password: string): string | null {
  if (password.length < 6) {
    return "La contrasena debe tener al menos 6 caracteres.";
  }

  if (!/[A-Za-z]/.test(password)) {
    return "La contrasena debe incluir al menos una letra.";
  }

  if (!/\d/.test(password)) {
    return "La contrasena debe incluir al menos un numero.";
  }

  return null;
}

function buildSessionUser(user: AuthResponse["user"], token: string): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    token,
  };
}

export async function login(email: string, password: string): Promise<LoginResult> {
  try {
    const response = await fetch(`${BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      return {
        ok: false,
        message: error?.message ?? "Email o contrasena incorrectos.",
      };
    }

    const data = (await response.json()) as AuthResponse;
    const sessionUser = buildSessionUser(data.user, data.accessToken);
    saveSessionUser(sessionUser);

    return { ok: true, user: sessionUser };
  } catch {
    return {
      ok: false,
      message: "No se pudo conectar con el servidor. Intenta de nuevo.",
    };
  }
}

export async function register(
  name: string,
  email: string,
  password: string,
  role: UserRole,
  avatarUrl: string | null = null,
): Promise<RegisterResult> {
  const passwordValidationMessage = getPasswordValidationMessage(password);
  if (passwordValidationMessage) {
    return {
      ok: false,
      message: passwordValidationMessage,
    };
  }

  try {
    const response = await fetch(`${BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        password,
        role,
        avatar: avatarUrl || undefined,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      return {
        ok: false,
        message: error?.message ?? "No se pudo crear la cuenta.",
      };
    }

    const data = (await response.json()) as AuthResponse;
    const sessionUser = buildSessionUser(data.user, data.accessToken);
    saveSessionUser(sessionUser);

    return { ok: true, user: sessionUser };
  } catch {
    return {
      ok: false,
      message: "No se pudo conectar con el servidor. Intenta de nuevo.",
    };
  }
}

export async function updateProfile(
  userId: number,
  input: UpdateProfileInput,
): Promise<UpdateResult> {
  return {
    ok: false,
    message: "Esta operacion no esta disponible en esta version.",
  };
}

export async function updatePassword(
  userId: number,
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
): Promise<UpdateResult> {
  return {
    ok: false,
    message: "Esta operacion no esta disponible en esta version.",
  };
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function getSessionUser(): SessionUser | null {
  const rawUser = localStorage.getItem(SESSION_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawUser) as SessionUser;
    return {
      ...parsed,
      avatarUrl: parsed.avatarUrl ?? null,
    };
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function getSessionToken(): string | null {
  return getSessionUser()?.token ?? null;
}

export function isAuthenticated(): boolean {
  return getSessionUser() !== null;
}

export function getMockAccounts(): Array<{
  label: string;
  email: string;
  password: string;
}> {
  return [
    {
      label: "Buyer demo",
      email: "buyer@autopoint.com",
      password: "1234",
    },
    {
      label: "Seller demo",
      email: "seller@autopoint.com",
      password: "1234",
    },
  ];
}

export function getPasswordRequirements(): string {
  return "Usa al menos 6 caracteres, incluyendo una letra y un numero.";
}
