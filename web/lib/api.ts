const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const TOKEN_KEY = 'hawk_token';

export class ApiError extends Error {
  constructor(public status: number, public messages: string[]) {
    super(messages[0] ?? 'Erro inesperado');
  }
}

// "Lembrar-me": localStorage persiste; sessionStorage some ao fechar a aba
export const tokenStore = {
  get: () =>
    typeof window === 'undefined'
      ? null
      : localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY),
  set: (token: string, remember = true) => {
    tokenStore.clear();
    (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  },
};

type Options = { method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'; body?: unknown };

export async function api<T>(path: string, { method = 'GET', body }: Options = {}): Promise<T> {
  const token = tokenStore.get();
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, ['Não foi possível conectar ao servidor']);
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401 && token) {
      tokenStore.clear();
      window.location.href = '/login';
    }
    const msg = data?.message;
    throw new ApiError(res.status, Array.isArray(msg) ? msg : [msg ?? 'Erro inesperado']);
  }
  return data as T;
}