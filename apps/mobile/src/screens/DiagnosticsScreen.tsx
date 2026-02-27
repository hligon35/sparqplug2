import React, { useMemo, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import Constants from 'expo-constants';

import { Screen } from '../components/ui/Screen';
import { Card } from '../components/ui/Card';
import { ListRow } from '../components/ui/ListRow';
import { SectionHeader } from '../components/ui/SectionHeader';
import { apiFetch } from '../utils/apiClient';
import { useDebug } from '../hooks/useDebug';
import { debugLog } from '../debug/debugStore';

// DiagnosticsScreen: runtime environment + connectivity checks for Expo builds.
export function DiagnosticsScreen() {
  const debug = useDebug();
  const [apiStatus, setApiStatus] = useState<string>('Not run');

  const sdkVersion = Constants.expoConfig?.sdkVersion ?? 'unknown';
  const appVersion = Constants.expoConfig?.version ?? 'unknown';
  const buildProfile =
    process.env.EAS_BUILD_PROFILE ??
    process.env.EXPO_PUBLIC_EAS_BUILD_PROFILE ??
    process.env.EXPO_PUBLIC_BUILD_PROFILE ??
    'dev';

  const webOnline = typeof navigator !== 'undefined' ? (navigator as any).onLine : undefined;

  const expectedSdkMajor = 54;
  const sdkMajor = Number(String(sdkVersion).split('.')[0] || 0);
  const sdkOk = sdkMajor === expectedSdkMajor;

  const rows = useMemo(
    () => [
      { title: 'Platform', rightText: Platform.OS },
      { title: 'Expo SDK', rightText: String(sdkVersion) + (sdkOk ? '' : ' (unexpected)') },
      { title: 'App Version', rightText: String(appVersion) },
      { title: 'Build Profile', rightText: String(buildProfile) },
      { title: 'Web Online', rightText: webOnline === undefined ? 'n/a' : webOnline ? 'true' : 'false' }
    ],
    [appVersion, buildProfile, sdkOk, sdkVersion, webOnline]
  );

  return (
    <Screen title="Diagnostics" statusText={debug?.enabled ? 'Debug mode enabled' : null}>
      <SectionHeader title="Environment" />
      <Card>
        {rows.map((r, idx) => (
          <ListRow
            key={r.title}
            title={r.title}
            rightText={r.rightText}
            showDivider={idx !== rows.length - 1}
          />
        ))}
      </Card>

      <SectionHeader title="Connectivity" />
      <Card>
        <ListRow title="API Test" subtitle={apiStatus} rightText="Run" onPress={async () => {
          const start = Date.now();
          setApiStatus('Running...');
          try {
            const payload = await apiFetch('/health');
            const ms = Date.now() - start;
            setApiStatus(`OK (${ms}ms)`);
            debugLog('log', 'diagnostics', 'API health OK', { ms, payload });
          } catch (e: any) {
            const ms = Date.now() - start;
            setApiStatus(`FAILED (${ms}ms)`);
            debugLog('warn', 'diagnostics', 'API health FAILED', { ms, error: String(e?.message || e) });
          }
        }} showDivider={false} />
      </Card>

      {sdkOk ? null : (
        <View className="px-1">
          <Text className="text-xs opacity-70">Expected Expo SDK {expectedSdkMajor}.x for this repo.</Text>
        </View>
      )}
    </Screen>
  );
}
