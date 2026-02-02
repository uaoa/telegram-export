import type { ApiCredentials } from '../types/auth';

const STORAGE_KEYS = {
  API_CREDENTIALS: 'tg_export_api_credentials',
  SESSION: 'tg_export_session',
} as const;

export function saveApiCredentials(credentials: ApiCredentials): void {
  localStorage.setItem(STORAGE_KEYS.API_CREDENTIALS, JSON.stringify(credentials));
}

export function getApiCredentials(): ApiCredentials | null {
  const stored = localStorage.getItem(STORAGE_KEYS.API_CREDENTIALS);
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored);
    if (parsed.apiId && parsed.apiHash) {
      return {
        apiId: Number(parsed.apiId),
        apiHash: String(parsed.apiHash),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function clearApiCredentials(): void {
  localStorage.removeItem(STORAGE_KEYS.API_CREDENTIALS);
}

export function saveSession(session: string): void {
  localStorage.setItem(STORAGE_KEYS.SESSION, session);
}

export function getSession(): string | null {
  return localStorage.getItem(STORAGE_KEYS.SESSION);
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
}

export function clearAllData(): void {
  clearApiCredentials();
  clearSession();
}
