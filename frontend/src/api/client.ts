const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const data = await response.json().catch(() => ({ detail: '请求失败' }));
    throw new ApiError(data.detail ?? '请求失败', response.status);
  }
  return response.json() as Promise<T>;
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  return parseResponse<T>(response);
}

export async function apiSend<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init);
  return parseResponse<T>(response);
}

export function assetUrl(path?: string | null) {
  if (!path) return '';
  return path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
}
