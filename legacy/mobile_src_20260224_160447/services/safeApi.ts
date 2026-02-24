import AsyncStorage from "@react-native-async-storage/async-storage";

type ListResponse<T> = { data: T[] };

function toErrorMessage(e: any): string {
  if (!e) return "Unknown error";
  return e?.message ?? String(e);
}

export function shouldUseMock(): boolean {
  if (mockOverride != null) return mockOverride;
  return String(process.env.EXPO_PUBLIC_USE_MOCK ?? "").toLowerCase() === "true";
}

const MOCK_OVERRIDE_KEY = "sparqplug.useMockOverride";
let mockOverride: boolean | null = null;
const mockListeners = new Set<() => void>();

function notifyMockListeners() {
  for (const cb of Array.from(mockListeners)) {
    try {
      cb();
    } catch {
      // ignore
    }
  }
}

export function getMockOverride(): boolean | null {
  return mockOverride;
}

export function subscribeMockOverride(listener: () => void): () => void {
  mockListeners.add(listener);
  return () => mockListeners.delete(listener);
}

export async function initMockOverride(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(MOCK_OVERRIDE_KEY);
    if (raw === "true") mockOverride = true;
    else if (raw === "false") mockOverride = false;
    else mockOverride = null;
  } catch {
    mockOverride = null;
  } finally {
    notifyMockListeners();
  }
}

export async function setMockOverride(next: boolean | null): Promise<void> {
  mockOverride = next;
  try {
    if (next == null) await AsyncStorage.removeItem(MOCK_OVERRIDE_KEY);
    else await AsyncStorage.setItem(MOCK_OVERRIDE_KEY, next ? "true" : "false");
  } finally {
    notifyMockListeners();
  }
}

function shouldFallbackToMockOnError(): boolean {
  // Default to true in dev for smoother local work, false in production.
  const raw = process.env.EXPO_PUBLIC_FALLBACK_TO_MOCK_ON_ERROR;
  if (raw == null || raw === "") return __DEV__;
  return String(raw).toLowerCase() === "true";
}

export async function listWithFallback<T>(
  realCall: () => Promise<any>,
  mockData: T[]
): Promise<{ data: T[]; usingMock: boolean; error: string | null }> {
  if (shouldUseMock()) {
    return { data: mockData, usingMock: true, error: null };
  }

  try {
    const res = await realCall();
    const data = Array.isArray(res?.data) ? res.data : res?.data?.results ?? [];
    return { data, usingMock: false, error: null };
  } catch (e: any) {
    const msg = toErrorMessage(e);
    if (shouldFallbackToMockOnError()) {
      return { data: mockData, usingMock: true, error: msg };
    }
    return { data: [], usingMock: false, error: msg };
  }
}
