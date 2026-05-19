import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type Method,
} from "axios";

const SESSION_KEY = "auto_market_session";

export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type ApiConfig = Omit<AxiosRequestConfig, "url" | "data" | "method" | "auth">;

export type ApiRequestOptions = ApiConfig & {
  auth?: boolean;
  body?: unknown;
  method?: Method;
};

export const API_BASE_URL = normalizeApiBaseUrl(
  import.meta.env.VITE_API_URL || "http://localhost:3000/api",
);

export function getApiUrl(path = ""): string {
  const normalizedPath = path.replace(/^\/+/, "");
  return normalizedPath ? `${API_BASE_URL}/${normalizedPath}` : API_BASE_URL;
}

function normalizeApiBaseUrl(value: string): string {
  const trimmed = value.replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

function clearStoredSession(): void {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event("auth:unauthorized"));
}

function getStoredToken(): string | null {
  const rawUser =
    localStorage.getItem(SESSION_KEY) ?? sessionStorage.getItem(SESSION_KEY);

  if (!rawUser) return null;

  try {
    const parsed = JSON.parse(rawUser) as { token?: string };
    return parsed.token ?? null;
  } catch {
    clearStoredSession();
    return null;
  }
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = (payload as { message?: unknown }).message;
    if (Array.isArray(message)) return message.join(" ");
    if (typeof message === "string") return message;
  }

  if (payload && typeof payload === "object" && "messages" in payload) {
    const messages = (payload as { messages?: unknown }).messages;
    if (Array.isArray(messages)) return messages.join(" ");
    if (typeof messages === "string") return messages;
  }

  return fallback;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<unknown>) => {
    const status = error.response?.status ?? 0;
    const payload = error.response?.data;

    if (status === 401) {
      clearStoredSession();
    }

    throw new ApiError(
      getErrorMessage(payload, error.message || "No se pudo conectar con el servidor."),
      status,
      payload,
    );
  },
);

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { body, method = "GET", auth: _auth, ...config } = options;
  const response = await apiClient.request<T>({
    ...config,
    url: path,
    method,
    data: body,
  });

  return response.data;
}

export function apiGet<T>(path: string, config?: ApiConfig): Promise<T> {
  return apiRequest<T>(path, { ...config, method: "GET" });
}

export function apiPost<T, TBody = unknown>(
  path: string,
  body?: TBody,
  config?: ApiConfig,
): Promise<T> {
  return apiRequest<T>(path, { ...config, method: "POST", body });
}

export function apiPatch<T, TBody = unknown>(
  path: string,
  body?: TBody,
  config?: ApiConfig,
): Promise<T> {
  return apiRequest<T>(path, { ...config, method: "PATCH", body });
}

export function apiDelete<T>(path: string, config?: ApiConfig): Promise<T> {
  return apiRequest<T>(path, { ...config, method: "DELETE" });
}
