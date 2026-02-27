import React, { createContext, useEffect, useMemo, useSyncExternalStore } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

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

// DebugProvider: global debug mode + toggles + log buffer.
// This powers the in-app debug panel and is safe to keep mounted in production
// (it is off by default and intentionally non-intrusive).

type DebugContextValue = DebugState & {
  setEnabled: (enabled: boolean) => void;
  patchToggles: (partial: Partial<DebugToggles>) => void;
  clearLogs: () => void;
};

const DebugContext = createContext<DebugContextValue | null>(null);

export function DebugProvider({ children }: { children: React.ReactNode }) {
  const debugState = useSyncExternalStore(subscribeDebug, getDebugState, getDebugState);

  useEffect(() => {
    // Load persisted settings once at startup.
    void initDebugStore().finally(() => {
      // Startup environment validation (non-blocking): helps catch mismatch issues early.
      const sdkVersion = Constants.expoConfig?.sdkVersion ?? 'unknown';
      const buildProfile =
        process.env.EAS_BUILD_PROFILE ??
        process.env.EXPO_PUBLIC_EAS_BUILD_PROFILE ??
        process.env.EXPO_PUBLIC_BUILD_PROFILE ??
        'dev';

      debugLog('log', 'env', 'Startup environment', {
        platform: Platform.OS,
        sdkVersion,
        buildProfile
      });

      const expectedSdkMajor = 54;
      const sdkMajor = Number(String(sdkVersion).split('.')[0] || 0);
      if (sdkMajor && sdkMajor !== expectedSdkMajor) {
        debugLog('warn', 'env', 'Unexpected Expo SDK major version', {
          expectedSdkMajor,
          sdkVersion
        });
      }
    });
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
  const ctx = React.useContext(DebugContext);
  return ctx;
}
