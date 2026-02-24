import axios from "axios";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { debugStore } from "./debugStore";
import { captureException } from "./telemetry";

function createRequestId(): string {
  // Deterministic-enough, fast, and works in RN without crypto deps.
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}

function normalizeBaseUrl(url: string): string {
  // Keep it simple: trim trailing slashes so endpoint paths behave consistently.
  return String(url || "").trim().replace(/\/+$/, "");
}

const DEFAULT_API_BASE_URL = __DEV__
  ? "http://localhost/api"
  : "https://sparqplug.getsparqd.com/api";

const apiBaseUrl = normalizeBaseUrl(
  process.env.EXPO_PUBLIC_API_BASE_URL ??
    ((Constants?.expoConfig?.extra as any)?.apiBaseUrl ?? "http://localhost:8000/api")
);

export const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000
});

// Separate client for auth calls (no token refresh interceptor to avoid loops).
export const authApi = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000
});

type StoredAuth = {
  accessToken: string;
  refreshToken: string;
  username?: string;
};

export type FirebaseIdTokenProvider = () => Promise<string | null> | string | null;

let firebaseIdTokenProvider: FirebaseIdTokenProvider | null = null;

export function setFirebaseIdTokenProvider(provider: FirebaseIdTokenProvider | null) {
  firebaseIdTokenProvider = provider;
}

const AUTH_KEY = "sparqplug.auth";

let refreshInFlight: Promise<string | null> | null = null;

async function readStoredAuth(): Promise<StoredAuth | null> {
  const raw = await AsyncStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredAuth;
    if (!parsed?.refreshToken) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const res = await authApi.post("/auth/token/refresh/", { refresh: refreshToken });
    const next = String(res?.data?.access ?? "");
    return next ? next : null;
  } catch {
    return null;
  }
}

api.interceptors.request.use(async (config) => {
  const headers = (config.headers ??= {} as any);
  if (!headers["X-Request-ID"]) {
    headers["X-Request-ID"] = createRequestId();
  }

  // Optional: forward a Firebase Auth ID token alongside the existing Bearer token.
  // This is intentionally additive (does not replace Authorization).
  if (firebaseIdTokenProvider && !headers["X-Firebase-ID-Token"]) {
    try {
      const token = await firebaseIdTokenProvider();
      const trimmed = token ? String(token).trim() : "";
      if (trimmed) {
        headers["X-Firebase-ID-Token"] = trimmed;
      }
    } catch {
      // keep requests safe if provider fails
    }
  }

  return config;
});

authApi.interceptors.request.use((config) => {
  const headers = (config.headers ??= {} as any);
  if (!headers["X-Request-ID"]) {
    headers["X-Request-ID"] = createRequestId();
  }
  return config;
});

api.interceptors.response.use(
  (resp) => resp,
  (error) => {
    const headers = error?.response?.headers ?? {};
    const requestId = headers["x-request-id"] ?? headers["X-Request-ID"];
    const errorId = headers["x-error-id"] ?? headers["X-Error-ID"];

    if (__DEV__ && (requestId || errorId)) {
      // eslint-disable-next-line no-console
      console.warn("API error ids", {
        status: error?.response?.status,
        url: error?.config?.url,
        requestId,
        errorId
      });
    }

    (error as any).sparq = {
      status: error?.response?.status,
      requestId,
      errorId
    };

    try {
      debugStore.addApiFailure({
        status: error?.response?.status,
        url: error?.config?.url,
        method: error?.config?.method,
        requestId,
        errorId,
        message:
          error?.response?.data?.detail ??
          error?.message ??
          "Request failed"
      });
    } catch {
      // keep interceptor safe
    }

    // Production telemetry (if enabled).
    captureException(
      error,
      {
        kind: "api_error",
        status: error?.response?.status,
        request_id: requestId,
        error_id: errorId
      },
      {
        url: error?.config?.url,
        method: error?.config?.method,
        responseData: error?.response?.data
      }
    );

    return Promise.reject(error);
  }
);

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

api.interceptors.response.use(
  (resp) => resp,
  async (error) => {
    const status = error?.response?.status;
    const data = error?.response?.data;
    const code = data?.code;
    const detail = typeof data?.detail === "string" ? data.detail : "";
    const original = error?.config;

    // Retry once on invalid/expired access tokens.
    if (status === 401 && original && !original.__sparqplugRetried) {
      const looksLikeJwtFailure =
        code === "token_not_valid" ||
        /token\s+not\s+valid/i.test(detail) ||
        /given token not valid/i.test(detail);

      if (looksLikeJwtFailure) {
        original.__sparqplugRetried = true;

        const stored = await readStoredAuth();
        if (!stored?.refreshToken) {
          return Promise.reject(error);
        }

        if (!refreshInFlight) {
          refreshInFlight = refreshAccessToken(stored.refreshToken).finally(() => {
            refreshInFlight = null;
          });
        }

        const newAccess = await refreshInFlight;
        if (!newAccess) {
          // Can't refresh; leave the error to the caller (UI can route to login).
          return Promise.reject(error);
        }

        const nextStored: StoredAuth = {
          ...stored,
          accessToken: newAccess
        };
        await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(nextStored));
        setAuthToken(newAccess);

        original.headers = {
          ...(original.headers ?? {}),
          Authorization: `Bearer ${newAccess}`
        };

        return api(original);
      }
    }

    return Promise.reject(error);
  }
);
