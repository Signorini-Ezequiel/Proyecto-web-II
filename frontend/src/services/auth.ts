import type {
  LoginResult,
  MockUser,
  RegisterResult,
  SessionUser,
  UserRole,
} from "../types/auth";

const SESSION_KEY = "auto_market_session";
const USERS_KEY = "auto_market_users";

type UpdateProfileInput = {
  name: string;
  avatarUrl: string | null;
};

type UpdateResult =
  | { ok: true; user: SessionUser }
  | { ok: false; message: string };

const defaultUsers: MockUser[] = [
  {
    id: 1,
    name: "Bruno Lopez",
    email: "buyer@autopoint.com",
    password: "1234",
    role: "buyer",
    avatarUrl: null,
  },
  {
    id: 2,
    name: "Lucia Fernandez",
    email: "seller@autopoint.com",
    password: "1234",
    role: "seller",
    avatarUrl: null,
  },
];

function saveUsers(users: MockUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function saveSessionUser(user: SessionUser): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function normalizeUser(user: MockUser): MockUser {
  return {
    ...user,
    avatarUrl: user.avatarUrl ?? null,
  };
}

function getUsers(): MockUser[] {
  const raw = localStorage.getItem(USERS_KEY);

  if (!raw) {
    saveUsers(defaultUsers);
    return defaultUsers;
  }

  try {
    const parsed = JSON.parse(raw) as MockUser[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveUsers(defaultUsers);
      return defaultUsers;
    }

    const normalizedUsers = parsed.map(normalizeUser);
    saveUsers(normalizedUsers);
    return normalizedUsers;
  } catch {
    saveUsers(defaultUsers);
    return defaultUsers;
  }
}

function buildSessionUser(user: MockUser): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
  };
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

export function getUserById(id: number): MockUser | null {
  const users = getUsers();
  return users.find((user) => user.id === id) || null;
}

export function login(email: string, password: string): LoginResult {
  const users = getUsers();
  const normalizedEmail = email.trim().toLowerCase();

  const user = users.find(
    (item) =>
      item.email.toLowerCase() === normalizedEmail && item.password === password
  );

  if (!user) {
    return {
      ok: false,
      message: "Email o contrasena incorrectos.",
    };
  }

  const sessionUser = buildSessionUser(user);
  saveSessionUser(sessionUser);

  return {
    ok: true,
    user: sessionUser,
  };
}

export function register(
  name: string,
  email: string,
  password: string,
  role: UserRole,
  avatarUrl: string | null = null
): RegisterResult {
  const users = getUsers();
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = name.trim();

  if (!normalizedName || !normalizedEmail || !password) {
    return {
      ok: false,
      message: "Completa todos los campos obligatorios.",
    };
  }

  const passwordValidationMessage = getPasswordValidationMessage(password);
  if (passwordValidationMessage) {
    return {
      ok: false,
      message: passwordValidationMessage,
    };
  }

  const exists = users.some(
    (item) => item.email.toLowerCase() === normalizedEmail
  );

  if (exists) {
    return {
      ok: false,
      message: "Ya existe una cuenta registrada con ese email.",
    };
  }

  const newUser: MockUser = {
    id: Date.now(),
    name: normalizedName,
    email: normalizedEmail,
    password,
    role,
    avatarUrl,
  };

  const updatedUsers = [...users, newUser];
  saveUsers(updatedUsers);

  const sessionUser = buildSessionUser(newUser);
  saveSessionUser(sessionUser);

  return {
    ok: true,
    user: sessionUser,
  };
}

export function updateProfile(
  userId: number,
  input: UpdateProfileInput
): UpdateResult {
  const users = getUsers();
  const normalizedName = input.name.trim();

  if (!normalizedName) {
    return {
      ok: false,
      message: "El nombre de usuario no puede estar vacio.",
    };
  }

  const userIndex = users.findIndex((user) => user.id === userId);

  if (userIndex === -1) {
    return {
      ok: false,
      message: "No encontramos tu perfil.",
    };
  }

  const updatedUser: MockUser = {
    ...users[userIndex],
    name: normalizedName,
    avatarUrl: input.avatarUrl,
  };

  const updatedUsers = [...users];
  updatedUsers[userIndex] = updatedUser;
  saveUsers(updatedUsers);

  const sessionUser = buildSessionUser(updatedUser);
  saveSessionUser(sessionUser);

  return {
    ok: true,
    user: sessionUser,
  };
}

export function updatePassword(
  userId: number,
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): UpdateResult {
  const users = getUsers();
  const userIndex = users.findIndex((user) => user.id === userId);

  if (userIndex === -1) {
    return {
      ok: false,
      message: "No encontramos tu perfil.",
    };
  }

  const user = users[userIndex];

  if (user.password !== currentPassword) {
    return {
      ok: false,
      message: "La contrasena actual no coincide.",
    };
  }

  if (newPassword !== confirmPassword) {
    return {
      ok: false,
      message: "La nueva contrasena y la confirmacion no coinciden.",
    };
  }

  if (newPassword === currentPassword) {
    return {
      ok: false,
      message: "Elige una contrasena distinta a la actual.",
    };
  }

  const passwordValidationMessage = getPasswordValidationMessage(newPassword);
  if (passwordValidationMessage) {
    return {
      ok: false,
      message: passwordValidationMessage,
    };
  }

  const updatedUser: MockUser = {
    ...user,
    password: newPassword,
  };

  const updatedUsers = [...users];
  updatedUsers[userIndex] = updatedUser;
  saveUsers(updatedUsers);

  const sessionUser = buildSessionUser(updatedUser);
  saveSessionUser(sessionUser);

  return {
    ok: true,
    user: sessionUser,
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
