import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useDebug } from '../hooks/useDebug';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

// DebugPanel (web): global overlay shown only when debug mode is enabled.
export function DebugPanel() {
  const debug = useDebug();
  const navigate = useNavigate();
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
    <div className="fixed top-4 right-4 z-50 w-[260px]">
      <Card className="p-0 overflow-hidden">
        <button
          type="button"
          className="w-full px-3 py-2 flex items-center justify-between"
          onClick={() => setExpanded((v) => !v)}
        >
          <div className="font-bold text-[#111827]">Debug</div>
          <div className="text-xs opacity-70">{logCount} logs</div>
        </button>

        {expanded ? (
          <div className="px-3 pb-3">
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

            <div className="mt-3 flex flex-col gap-2">
              <Button variant="secondary" onClick={() => navigate('/diagnostics')}>
                Diagnostics
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  const blob = new Blob([exportText], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `sparqplug-debug-${Date.now()}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Export logs
              </Button>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Button variant="ghost" onClick={() => debug.clearLogs()}>
                    Clear
                  </Button>
                </div>
                <div className="flex-1">
                  <Button variant="ghost" onClick={() => debug.setEnabled(false)}>
                    Off
                  </Button>
                </div>
              </div>
              <div className="text-[11px] opacity-70">Hotkey: Ctrl+Shift+D</div>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
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
    <button type="button" className="w-full py-2 flex items-center justify-between" onClick={onToggle}>
      <div className="text-sm text-[#111827]">{label}</div>
      <div className="text-xs font-bold opacity-70">{value ? 'ON' : 'OFF'}</div>
    </button>
  );
}
