import type {
  AuthResponseDto,
  LoginDto,
  LoginResult,
  RegisterDto,
  RegisterResult,
  SessionUser,
  UpdatePasswordDto,
  UpdateUserDto,
  UserRole,
} from "../types/auth";
import { ApiError, apiGet, apiPatch, apiPost } from "./api";

const SESSION_KEY = "auto_market_session";

type UpdateResult =
  | { ok: true; user: SessionUser }
  | { ok: false; message: string };

type AuthState = {
  isAuthenticated: boolean;
  user: SessionUser | null;
  token: string | null;
};

type AuthListener = (state: AuthState) => void;

const authListeners = new Set<AuthListener>();

function saveSessionUser(user: SessionUser): void {
  const serializedUser = JSON.stringify(user);
  localStorage.setItem(SESSION_KEY, serializedUser);
  sessionStorage.setItem(SESSION_KEY, serializedUser);
  notifyAuthListeners();
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

function buildSessionUser(user: AuthResponseDto["user"], token: string): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    token,
  };
}

function readStoredSession(): SessionUser | null {
  const rawUser =
    localStorage.getItem(SESSION_KEY) ?? sessionStorage.getItem(SESSION_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawUser) as SessionUser;

    if (!parsed.token || isTokenExpired(parsed.token)) {
      clearStoredSession();
      return null;
    }

    return {
      ...parsed,
      avatarUrl: parsed.avatarUrl ?? null,
    };
  } catch {
    clearStoredSession();
    return null;
  }
}

function clearStoredSession(): void {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

function getTokenPayload(token: string): { exp?: number } | null {
  const [, payload] = token.split(".");

  if (!payload) {
    return null;
  }

  try {
    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decodedPayload = atob(normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, "="));
    return JSON.parse(decodedPayload) as { exp?: number };
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const payload = getTokenPayload(token);

  if (!payload?.exp) {
    return true;
  }

  return payload.exp * 1000 <= Date.now();
}

function notifyAuthListeners(): void {
  const state = getAuthState();
  authListeners.forEach((listener) => listener(state));
}

export async function login(email: string, password: string): Promise<LoginResult> {
  try {
    const body: LoginDto = { email: email.trim(), password };
    const data = await apiPost<AuthResponseDto, LoginDto>("auth/login", body);
    const sessionUser = buildSessionUser(data.user, data.accessToken);
    saveSessionUser(sessionUser);

    return { ok: true, user: sessionUser };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof ApiError
          ? error.message
          : "No se pudo conectar con el servidor. Intenta de nuevo.",
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
    const body: RegisterDto = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role,
      avatarUrl: avatarUrl || undefined,
    };
    const data = await apiPost<AuthResponseDto, RegisterDto>("auth/register", body);
    const sessionUser = buildSessionUser(data.user, data.accessToken);
    saveSessionUser(sessionUser);

    return { ok: true, user: sessionUser };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof ApiError
          ? error.message
          : "No se pudo conectar con el servidor. Intenta de nuevo.",
    };
  }
}

export async function updateProfile(
  userId: number,
  input: UpdateUserDto,
): Promise<UpdateResult> {
  try {
    const user = await apiPatch<AuthResponseDto["user"], UpdateUserDto>(`users/${userId}`, {
      name: input.name?.trim(),
      avatarUrl: input.avatarUrl,
    });
    const currentToken = getSessionToken();
    const sessionUser = buildSessionUser(user, currentToken ?? "");
    saveSessionUser(sessionUser);

    return { ok: true, user: sessionUser };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof ApiError
          ? error.message
          : "No se pudo actualizar el perfil.",
    };
  }
}

export async function updatePassword(
  userId: number,
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
): Promise<UpdateResult> {
  try {
    const body: UpdatePasswordDto = {
      currentPassword,
      newPassword,
      confirmPassword,
    };
    const user = await apiPatch<AuthResponseDto["user"], UpdatePasswordDto>(`users/${userId}/password`, body);
    const currentToken = getSessionToken();
    const sessionUser = buildSessionUser(user, currentToken ?? "");
    saveSessionUser(sessionUser);

    return { ok: true, user: sessionUser };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof ApiError
          ? error.message
          : "No se pudo actualizar la contrasena.",
    };
  }
}

export function logout(): void {
  clearStoredSession();
  notifyAuthListeners();
}

export function getSessionUser(): SessionUser | null {
  return readStoredSession();
}

export function getUserById(id: number | string): SessionUser | null {
  const currentUser = getSessionUser();
  return currentUser?.id === Number(id) ? currentUser : null;
}

export function getSessionToken(): string | null {
  return getSessionUser()?.token ?? null;
}

export function isAuthenticated(): boolean {
  return getSessionUser() !== null;
}

export function getAuthState(): AuthState {
  const user = getSessionUser();

  return {
    isAuthenticated: user !== null,
    user,
    token: user?.token ?? null,
  };
}

export function subscribeAuth(listener: AuthListener): () => void {
  authListeners.add(listener);
  listener(getAuthState());

  return () => {
    authListeners.delete(listener);
  };
}

export const useAuth = getAuthState;

export async function restoreSession(): Promise<SessionUser | null> {
  const currentUser = getSessionUser();

  if (!currentUser) {
    return null;
  }

  try {
    const user = await apiGet<AuthResponseDto["user"]>("auth/profile");
    const sessionUser = buildSessionUser(user, currentUser.token ?? "");
    saveSessionUser(sessionUser);
    return sessionUser;
  } catch {
    logout();
    return null;
  }
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
