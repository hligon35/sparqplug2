import AsyncStorage from "@react-native-async-storage/async-storage";

import { authApi, setAuthToken } from "./api";
import { getBiometricInfo, promptBiometric } from "./biometric";

const AUTH_KEY = "sparqplug.auth";
const LAST_BACKGROUND_AT_KEY = "sparqplug.auth.lastBackgroundAt";

function getSessionTimeoutMs(): number {
  // Time spent out of the app (background) before requiring re-login.
  // Defaults to 15 minutes.
  const raw = process.env.EXPO_PUBLIC_SESSION_TIMEOUT_SECONDS;
  const seconds = raw ? Number(raw) : 15 * 60;
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 15 * 60;
  return safeSeconds * 1000;
}

type StoredAuth = {
  accessToken: string;
  refreshToken: string;
  username: string;
};

async function writeAuth(auth: StoredAuth | null) {
  if (!auth) {
    await AsyncStorage.removeItem(AUTH_KEY);
    await AsyncStorage.removeItem(LAST_BACKGROUND_AT_KEY);
    setAuthToken(null);
    return;
  }
  await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(auth));
  // Reset any previous "away" timer when a fresh auth is written.
  await AsyncStorage.removeItem(LAST_BACKGROUND_AT_KEY);
  setAuthToken(auth.accessToken);
}

async function readAuth(): Promise<StoredAuth | null> {
  const raw = await AsyncStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

export async function getStoredUsername(): Promise<string | null> {
  const stored = await readAuth();
  return stored?.username ? String(stored.username) : null;
}

export async function hasStoredSession(): Promise<boolean> {
  const stored = await readAuth();
  return Boolean(stored?.refreshToken);
}

export async function markAppBackgrounded(): Promise<void> {
  const stored = await readAuth();
  if (!stored?.refreshToken) return;
  await AsyncStorage.setItem(LAST_BACKGROUND_AT_KEY, String(Date.now()));
}

export async function enforceSessionTimeout(): Promise<boolean> {
  const stored = await readAuth();
  if (!stored?.refreshToken) {
    await writeAuth(null);
    return false;
  }

  const raw = await AsyncStorage.getItem(LAST_BACKGROUND_AT_KEY);
  if (!raw) return true;

  const last = Number(raw);
  const timeoutMs = getSessionTimeoutMs();

  // timeoutMs=0 means "always require re-login on resume".
  if (!Number.isFinite(last) || timeoutMs <= 0) {
    await writeAuth(null);
    return false;
  }

  const elapsed = Date.now() - last;
  if (elapsed >= timeoutMs) {
    await writeAuth(null);
    return false;
  }

  // User came back in time; clear the away marker.
  await AsyncStorage.removeItem(LAST_BACKGROUND_AT_KEY);
  return true;
}

async function refreshWithToken(refreshToken: string, username: string): Promise<boolean> {
  try {
    const res = await authApi.post("/auth/token/refresh/", {
      refresh: refreshToken
    });

    const accessToken = String(res?.data?.access ?? "");
    if (!accessToken) throw new Error("Missing access token");

    await writeAuth({
      accessToken,
      refreshToken,
      username
    });

    return true;
  } catch {
    return false;
  }
}

export async function unlockWithBiometrics(): Promise<boolean> {
  const stored = await readAuth();
  if (!stored?.refreshToken) {
    await writeAuth(null);
    return false;
  }

  const info = await getBiometricInfo();
  if (!info.isAvailable) {
    // If biometrics aren't available, fall back to normal refresh.
    const ok = await refreshWithToken(stored.refreshToken, stored.username);
    if (!ok) await writeAuth(null);
    return ok;
  }

  const okBio = await promptBiometric(info.label);
  if (!okBio) {
    // Don't wipe session on cancel; just don't unlock.
    setAuthToken(null);
    return false;
  }

  const ok = await refreshWithToken(stored.refreshToken, stored.username);
  if (!ok) await writeAuth(null);
  return ok;
}

export async function restoreSession(): Promise<boolean> {
  const stored = await readAuth();
  if (!stored?.refreshToken) {
    await writeAuth(null);
    return false;
  }

  // Restore by refreshing the access token. Session timeout enforcement is handled separately.
  const ok = await refreshWithToken(stored.refreshToken, stored.username);
  if (!ok) await writeAuth(null);
  return ok;
}

export async function signIn(username: string, password: string) {
  const res = await authApi.post("/auth/token/", {
    username,
    password
  });

  const accessToken = String(res?.data?.access ?? "");
  const refreshToken = String(res?.data?.refresh ?? "");
  if (!accessToken || !refreshToken) {
    throw new Error("Invalid token response");
  }

  await writeAuth({ accessToken, refreshToken, username });
}

export async function signUp(name: string, email: string, password: string) {
  const username = email;
  await authApi.post("/users/", {
    username,
    email,
    name,
    password
  });

  await signIn(username, password);
}

export async function signOut() {
  await writeAuth(null);
}
