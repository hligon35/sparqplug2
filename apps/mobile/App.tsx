import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import React, { useRef } from 'react';

import { AuthProvider } from './src/providers/AuthProvider';
import { DebugProvider } from './src/providers/DebugProvider';
import { AppErrorBoundary } from './src/components/AppErrorBoundary';
import { RootNavigator } from './src/navigation/RootNavigator';
import type { RootStackParamList } from './src/navigation/RootNavigator';
import { DebugHotspot } from './src/components/debug/DebugHotspot';
import { DebugPanel } from './src/components/debug/DebugPanel';
import { debugLog, getDebugState } from './src/debug/debugStore';

const navigationRef = createNavigationContainerRef<RootStackParamList>();

export default function App() {
  const lastRouteName = useRef<string | null>(null);

  return (
    <DebugProvider>
      <AppErrorBoundary>
        <AuthProvider>
          <NavigationContainer
            ref={navigationRef}
            onReady={() => {
              lastRouteName.current = navigationRef.getCurrentRoute()?.name ?? null;
            }}
            onStateChange={() => {
              const debug = getDebugState();
              if (!debug.enabled || !debug.toggles.traceNavigation) return;

              const current = navigationRef.getCurrentRoute()?.name ?? 'unknown';
              if (current !== lastRouteName.current) {
                debugLog('log', 'nav', 'route', { from: lastRouteName.current, to: current });
                lastRouteName.current = current;
              }
            }}
          >
            <RootNavigator />
          </NavigationContainer>

          <DebugPanel
            onOpenDiagnostics={() => {
              const debug = getDebugState();
              if (!debug.enabled) return;
              if (navigationRef.isReady()) navigationRef.navigate('Diagnostics');
              else debugLog('warn', 'nav', 'navigation not ready');
            }}
          />
          <DebugHotspot />
        </AuthProvider>
      </AppErrorBoundary>
    </DebugProvider>
  );
}
