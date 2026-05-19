export interface ApiErrorPayload {
  message: string | string[];
  statusCode?: number;
  error?: string;
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };
