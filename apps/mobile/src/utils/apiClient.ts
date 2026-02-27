import { firebaseAuth } from '../config/firebaseClient';
import { consoleGroupCollapsed, consoleGroupEnd, debugLog, getDebugState } from '../debug/debugStore';

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

   const debug = getDebugState();
   const shouldLog = debug.enabled && debug.toggles.logApi;
   const method = (init.method || 'GET').toUpperCase();
   const startedAt = Date.now();
   const url = `${baseUrl}${normalizedPath}`;

   if (shouldLog) {
     consoleGroupCollapsed(`[api] ${method} ${normalizedPath}`);
     debugLog('log', 'api', 'request', { method, url, headers: init.headers });
     if (init.body) debugLog('log', 'api', 'request.body', init.body);
   }

  const token = await getIdToken();
  const headers = new Headers(init.headers);
  headers.set('Content-Type', headers.get('Content-Type') || 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    let payload: any = null;
    try {
      payload = await res.json();
    } catch {
      payload = null;
    }
    if (shouldLog) {
      debugLog('warn', 'api', 'response (error)', {
        status: res.status,
        ms: Date.now() - startedAt,
        payload
      });
      consoleGroupEnd();
    }
    const message = payload?.message || `Request failed: ${res.status}`;
    throw new Error(message);
  }
  if (res.status === 204) {
    if (shouldLog) {
      debugLog('log', 'api', 'response', { status: res.status, ms: Date.now() - startedAt });
      consoleGroupEnd();
    }
    return null;
  }

  const data = await res.json();
  if (shouldLog) {
    debugLog('log', 'api', 'response', { status: res.status, ms: Date.now() - startedAt, data });
    consoleGroupEnd();
  }
  return data;
}
