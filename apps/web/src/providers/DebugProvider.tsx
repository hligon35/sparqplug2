import React, { createContext, useEffect, useMemo, useSyncExternalStore } from 'react';

import {
  clearDebugLogs,
  debugLog,
  getDebugState,
  initDebugStore,
  patchDebugToggles,
  setDebugEnabled,
  subscribeDebug,
  type DebugState,
  type DebugToggles
} from '../debug/debugStore';

// DebugProvider (web): global debug mode + toggles + log buffer.
// Hotkey: Ctrl+Shift+D toggles debug mode.

type DebugContextValue = DebugState & {
  setEnabled: (enabled: boolean) => void;
  patchToggles: (partial: Partial<DebugToggles>) => void;
  clearLogs: () => void;
};

const DebugContext = createContext<DebugContextValue | null>(null);

export function DebugProvider({ children }: { children: React.ReactNode }) {
  const debugState = useSyncExternalStore(subscribeDebug, getDebugState, getDebugState);

  useEffect(() => {
    void initDebugStore().finally(() => {
      if (getDebugState().toggles.envDiagnostics) {
        debugLog('log', 'env', 'Startup environment', {
          mode: import.meta.env.MODE,
          online: navigator.onLine,
          userAgent: navigator.userAgent
        });
      }
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        setDebugEnabled(!getDebugState().enabled);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const value = useMemo<DebugContextValue>(
    () => ({
      ...debugState,
      setEnabled(enabled) {
        setDebugEnabled(enabled);
      },
      patchToggles(partial) {
        patchDebugToggles(partial);
      },
      clearLogs() {
        clearDebugLogs();
      }
    }),
    [debugState]
  );

  return <DebugContext.Provider value={value}>{children}</DebugContext.Provider>;
}

export function useDebugContext() {
  return React.useContext(DebugContext);
}
