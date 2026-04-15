import type {
  LoginResult,
  MockUser,
  RegisterResult,
  SessionUser,
  UserRole,
} from "../types/auth";

const SESSION_KEY = "auto_market_session";
const USERS_KEY = "auto_market_users";

const defaultUsers: MockUser[] = [
  {
    id: 1,
    name: "Bruno López",
    email: "buyer@autopoint.com",
    password: "1234",
    role: "buyer",
  },
  {
    id: 2,
    name: "Lucía Fernández",
    email: "seller@autopoint.com",
    password: "1234",
    role: "seller",
  },
];

function saveUsers(users: MockUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
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
    return parsed;
  } catch {
    saveUsers(defaultUsers);
    return defaultUsers;
  }
}

export function getUserById(id: number): MockUser | null {
  const users = getUsers();
  return users.find(user => user.id === id) || null;
}

function buildSessionUser(user: MockUser): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
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
      message: "Email o contraseña incorrectos.",
    };
  }

  const sessionUser = buildSessionUser(user);
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));

  return {
    ok: true,
    user: sessionUser,
  };
}

export function register(
  name: string,
  email: string,
  password: string,
  role: UserRole
): RegisterResult {
  const users = getUsers();
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = name.trim();

  if (!normalizedName || !normalizedEmail || !password) {
    return {
      ok: false,
      message: "Completá todos los campos obligatorios.",
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
  };

  const updatedUsers = [...users, newUser];
  saveUsers(updatedUsers);

  const sessionUser = buildSessionUser(newUser);
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));

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
    return JSON.parse(rawUser) as SessionUser;
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