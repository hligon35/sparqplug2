import { firebaseAuth } from '../config/firebaseClient';

function normalizeBaseUrl(url: string) {
  return String(url || '').trim().replace(/\/+$/, '');
}

const defaultBaseUrl = __DEV__ ? 'http://localhost:4000' : 'https://sparqplug.getsparqd.com';
const baseUrl = normalizeBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL ?? defaultBaseUrl);

async function getIdToken() {
  const user = firebaseAuth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  if (!baseUrl) throw new Error('Missing EXPO_PUBLIC_API_BASE_URL');

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  const token = await getIdToken();
  const headers = new Headers(init.headers);
  headers.set('Content-Type', headers.get('Content-Type') || 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${baseUrl}${normalizedPath}`, { ...init, headers });
  if (!res.ok) {
    let payload: any = null;
    try {
      payload = await res.json();
    } catch {
      payload = null;
    }
    const message = payload?.message || `Request failed: ${res.status}`;
    throw new Error(message);
  }
  if (res.status === 204) return null;
  return res.json();
}
