/**
 * Client HTTP unique vers l'API Spring Boot.
 * - Session : cookie HttpOnly posé par le backend (credentials: "include"). Aucun jeton côté JS.
 * - Erreurs : le backend répond en RFC 7807 (application/problem+json) ; elles sont exposées
 *   sous forme d'ApiError typée pour que l'interface affiche un message compréhensible.
 * Configurez NEXT_PUBLIC_API_URL (défaut : http://localhost:8080/api).
 */
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";

export interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  violations?: { field: string; message: string }[];
}

export class ApiError extends Error {
  readonly status: number;
  readonly problem: ProblemDetail | null;
  readonly path: string;

  constructor(status: number, problem: ProblemDetail | null, path: string) {
    super(problem?.detail ?? (status === 0 ? "Le serveur est injoignable." : `Erreur ${status} sur ${path}`));
    this.name = "ApiError";
    this.status = status;
    this.problem = problem;
    this.path = path;
  }

  /** Dernier segment du champ `type` RFC 7807, ex. « magic-link-invalid », « sold-out ». */
  get code(): string | null {
    const t = this.problem?.type;
    if (!t) return null;
    const i = t.lastIndexOf("/");
    return i >= 0 ? t.slice(i + 1) : t;
  }
}

export function isApiError(e: unknown): e is ApiError {
  return e instanceof ApiError;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
      credentials: "include",
      ...init,
    });
  } catch {
    throw new ApiError(0, null, path);
  }

  if (!res.ok) {
    let problem: ProblemDetail | null = null;
    try { problem = (await res.json()) as ProblemDetail; } catch { /* corps vide ou non JSON */ }
    throw new ApiError(res.status, problem, path);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const api = {
  get: <T>(p: string) => request<T>(p),
  post: <T>(p: string, body: unknown = {}) =>
    request<T>(p, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(p: string, body: unknown = {}) =>
    request<T>(p, { method: "PUT", body: JSON.stringify(body) }),
  del: <T>(p: string) => request<T>(p, { method: "DELETE" }),
};
