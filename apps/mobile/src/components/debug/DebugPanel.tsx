import React, { useMemo, useState } from 'react';
import { Pressable, Share, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDebug } from '../../hooks/useDebug';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

// DebugPanel: global, non-intrusive overlay shown only when debug mode is enabled.
export function DebugPanel({ onOpenDiagnostics }: { onOpenDiagnostics?: () => void }) {
  const debug = useDebug();
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState(false);

  const logCount = debug?.logs.length ?? 0;

  const exportText = useMemo(() => {
    if (!debug) return '';
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        enabled: debug.enabled,
        toggles: debug.toggles,
        logs: debug.logs
      },
      null,
      2
    );
  }, [debug]);

  if (!debug?.enabled) return null;

  return (
    <View pointerEvents="box-none" className="absolute inset-0">
      <View style={{ position: 'absolute', top: insets.top + 8, right: 8, width: 240 }}>
        <Card className="p-0 overflow-hidden">
          <Pressable className="px-3 py-2 flex-row items-center justify-between" onPress={() => setExpanded((v) => !v)}>
            <Text className="font-bold text-gray-900">Debug</Text>
            <Text className="text-xs opacity-70">{logCount} logs</Text>
          </Pressable>

          {expanded ? (
            <View className="px-3 pb-3">
              <ToggleRow
                label="Layout bounds"
                value={debug.toggles.showLayoutBounds}
                onToggle={() => debug.patchToggles({ showLayoutBounds: !debug.toggles.showLayoutBounds })}
              />
              <ToggleRow
                label="Render tracing"
                value={debug.toggles.traceRenders}
                onToggle={() => debug.patchToggles({ traceRenders: !debug.toggles.traceRenders })}
              />
              <ToggleRow
                label="Navigation tracing"
                value={debug.toggles.traceNavigation}
                onToggle={() => debug.patchToggles({ traceNavigation: !debug.toggles.traceNavigation })}
              />
              <ToggleRow
                label="API logging"
                value={debug.toggles.logApi}
                onToggle={() => debug.patchToggles({ logApi: !debug.toggles.logApi })}
              />
              <ToggleRow
                label="Error overlay"
                value={debug.toggles.showErrorOverlay}
                onToggle={() => debug.patchToggles({ showErrorOverlay: !debug.toggles.showErrorOverlay })}
              />
              <ToggleRow
                label="Env diagnostics"
                value={debug.toggles.envDiagnostics}
                onToggle={() => debug.patchToggles({ envDiagnostics: !debug.toggles.envDiagnostics })}
              />

              <View className="mt-3 gap-2">
                {onOpenDiagnostics ? (
                  <Button label="Diagnostics" variant="secondary" onPress={onOpenDiagnostics} />
                ) : null}
                <Button
                  label="Export logs"
                  variant="secondary"
                  onPress={async () => {
                    await Share.share({ message: exportText });
                  }}
                />
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <Button label="Clear" variant="ghost" onPress={() => debug.clearLogs()} />
                  </View>
                  <View className="flex-1">
                    <Button label="Off" variant="ghost" onPress={() => debug.setEnabled(false)} />
                  </View>
                </View>
              </View>
            </View>
          ) : null}
        </Card>
      </View>
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onToggle
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable className="py-2 flex-row items-center justify-between" onPress={onToggle}>
      <Text className="text-sm text-gray-900">{label}</Text>
      <Text className="text-xs font-bold opacity-70">{value ? 'ON' : 'OFF'}</Text>
    </Pressable>
  );
}
