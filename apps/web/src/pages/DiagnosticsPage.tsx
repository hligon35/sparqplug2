import React, { useMemo, useState } from 'react';

import { WebScreen } from '../components/ui/WebScreen';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Card } from '../components/ui/Card';
import { ListRow } from '../components/ui/ListRow';
import { apiFetch } from '../utils/apiClient';
import { debugLog } from '../debug/debugStore';

// DiagnosticsPage: runtime environment + connectivity checks.
export function DiagnosticsPage() {
  const [apiStatus, setApiStatus] = useState('Not run');

  const rows = useMemo(
    () => [
      { title: 'Mode', rightText: String(import.meta.env.MODE) },
      { title: 'Online', rightText: navigator.onLine ? 'true' : 'false' },
      { title: 'User Agent', rightText: navigator.userAgent }
    ],
    []
  );

  return (
    <WebScreen title="Diagnostics">
      <SectionHeader title="Environment" />
      <Card>
        {rows.map((r, idx) => (
          <ListRow key={r.title} title={r.title} rightText={r.rightText} showDivider={idx !== rows.length - 1} />
        ))}
      </Card>

      <SectionHeader title="Connectivity" />
      <Card>
        <ListRow
          title="API Test"
          subtitle={apiStatus}
          rightText="Run"
          onClick={async () => {
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
          }}
          showDivider={false}
        />
      </Card>
    </WebScreen>
  );
}
