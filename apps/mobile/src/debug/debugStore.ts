import AsyncStorage from '@react-native-async-storage/async-storage';

// Debug store (mobile): lightweight global diagnostics state + ring-buffer logging.
// This is intentionally framework-agnostic so it can be used from non-React modules
// like api clients.

export type DebugToggles = {
  showLayoutBounds: boolean;
  traceRenders: boolean;
  traceNavigation: boolean;
  logApi: boolean;
  showErrorOverlay: boolean;
  envDiagnostics: boolean;
};

export type DebugLogLevel = 'log' | 'warn' | 'error';

export type DebugLogEntry = {
  ts: number;
  level: DebugLogLevel;
  scope: string;
  message: string;
  data?: unknown;
};

export type DebugState = {
  enabled: boolean;
  toggles: DebugToggles;
  logs: DebugLogEntry[];
};

const STORAGE_KEY = 'sparqplug.debug.settings.v1';
const MAX_LOGS = 500;

const defaultState: DebugState = {
  enabled: false,
  toggles: {
    showLayoutBounds: false,
    traceRenders: false,
    traceNavigation: false,
    logApi: false,
    showErrorOverlay: true,
    envDiagnostics: true
  },
  logs: []
};

let state: DebugState = defaultState;
const listeners = new Set<(s: DebugState) => void>();
let initPromise: Promise<void> | null = null;

function emit() {
  for (const l of listeners) l(state);
}

function setState(next: DebugState) {
  state = next;
  emit();
}

async function persistSettings() {
  try {
    const payload = JSON.stringify({ enabled: state.enabled, toggles: state.toggles });
    await AsyncStorage.setItem(STORAGE_KEY, payload);
  } catch {
    // ignore persistence failures
  }
}

export function getDebugState() {
  return state;
}

export function subscribeDebug(listener: (s: DebugState) => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function initDebugStore() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<Pick<DebugState, 'enabled' | 'toggles'>>;
      setState({
        ...state,
        enabled: Boolean(parsed.enabled),
        toggles: { ...state.toggles, ...(parsed.toggles || {}) }
      });
    } catch {
      // ignore corrupted settings
    }
  })();

  return initPromise;
}

export function setDebugEnabled(enabled: boolean) {
  setState({ ...state, enabled });
  void persistSettings();
}

export function patchDebugToggles(partial: Partial<DebugToggles>) {
  setState({ ...state, toggles: { ...state.toggles, ...partial } });
  void persistSettings();
}

export function clearDebugLogs() {
  setState({ ...state, logs: [] });
}

export function addDebugLog(entry: DebugLogEntry) {
  const nextLogs = state.logs.length >= MAX_LOGS ? state.logs.slice(state.logs.length - MAX_LOGS + 1) : state.logs;
  setState({ ...state, logs: [...nextLogs, entry] });
}

export function debugLog(level: DebugLogLevel, scope: string, message: string, data?: unknown) {
  addDebugLog({ ts: Date.now(), level, scope, message, data });

  // Keep console noise low unless debug mode is enabled.
  if (!state.enabled && level === 'log') return;

  const fn = level === 'warn' ? console.warn : level === 'error' ? console.error : console.log;
  fn(`[${scope}] ${message}`, data ?? '');
}

export function consoleGroupCollapsed(label: string) {
  // Not all runtimes implement these; guard to keep this safe.
  const anyConsole = console as any;
  if (typeof anyConsole.groupCollapsed === 'function') anyConsole.groupCollapsed(label);
}

export function consoleGroupEnd() {
  const anyConsole = console as any;
  if (typeof anyConsole.groupEnd === 'function') anyConsole.groupEnd();
}
