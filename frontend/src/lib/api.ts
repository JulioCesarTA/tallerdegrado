import { getToken } from './auth';

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001') + '/api';

type ApiOptions = Omit<RequestInit, 'body'> & {
  auth?: boolean;
  body?: BodyInit | Record<string, unknown> | null;
};

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { auth = true, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers ?? {});

  if (!(fetchOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (auth !== false) {
    const token = getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...fetchOptions,
    headers,
    body:
      fetchOptions.body && !(fetchOptions.body instanceof FormData)
        ? typeof fetchOptions.body === 'string'
          ? fetchOptions.body
          : JSON.stringify(fetchOptions.body)
        : (fetchOptions.body as BodyInit | null | undefined),
  });

  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message ?? 'Error de conexión');
  }

  return data as T;
}
