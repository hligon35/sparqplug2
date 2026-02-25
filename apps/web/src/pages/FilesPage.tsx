import { WebScreen } from '../components/ui/WebScreen';
import { useEffect, useMemo, useState } from 'react';

import { apiFetch } from '../utils/apiClient';

import { Card } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Button } from '../components/ui/Button';
import { ListRow } from '../components/ui/ListRow';

type FileItem = { id: string; name?: string };

export function FilesPage() {
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<FileItem[]>([]);

  const statusText = useMemo(() => (offline ? 'Offline mode — changes may not sync' : null), [offline]);

  async function refresh() {
    setError(null);
    setBusy(true);
    try {
      const res = await apiFetch('/files', { method: 'GET' });
      setItems(res?.items ?? []);
      setOffline(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to load');
      setOffline(true);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <WebScreen title="Files" statusText={statusText}>
      <Card>
        <SectionHeader
          title="Files"
          subtitle={busy ? 'Loading…' : `${items.length} total`}
          right={
            <Button variant="secondary" disabled={busy} onClick={() => refresh()}>
              {busy ? 'Loading…' : 'Refresh'}
            </Button>
          }
        />
        <div className="mt-2">
          {items.length ? (
            items.map((f, idx) => (
              <ListRow
                key={f.id}
                title={f.name || 'Unnamed file'}
                rightText={f.id.slice(0, 6)}
                showDivider={idx !== items.length - 1}
              />
            ))
          ) : (
            <div className="text-sm opacity-70 py-6">No files yet.</div>
          )}
        </div>
        {error ? <div className="text-xs text-red-600 mt-3">{error}</div> : null}
      </Card>
    </WebScreen>
  );
}
