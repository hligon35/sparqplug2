import { WebScreen } from '../components/ui/WebScreen';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiFetch } from '../utils/apiClient';

import { Card } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Button } from '../components/ui/Button';
import { ListRow } from '../components/ui/ListRow';
import { StackModal } from '../components/ui/StackModal';
import { FloatingLabelInput } from '../components/ui/FloatingLabelInput';

type Client = { id: string; name?: string; email?: string };

export function ClientsPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [items, setItems] = useState<Client[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const statusText = useMemo(() => (offline ? 'Offline mode — changes may not sync' : null), [offline]);

  async function refresh() {
    setError(null);
    setBusy(true);
    try {
      const res = await apiFetch('/clients', { method: 'GET' });
      setItems(res?.items ?? []);
      setOffline(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to load');
      setOffline(true);
    } finally {
      setBusy(false);
    }
  }

  async function createClient() {
    setError(null);
    setBusy(true);
    try {
      await apiFetch('/clients', { method: 'POST', body: JSON.stringify({ name, email }) });
      setCreateOpen(false);
      setName('');
      setEmail('');
      await refresh();
    } catch (err: any) {
      setError(err?.message || 'Failed to create');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <WebScreen
      title="Clients"
      statusText={statusText}
      headerRight={
        <Button variant="secondary" disabled={busy} onClick={() => setCreateOpen(true)}>
          Add
        </Button>
      }
    >
      <Card>
        <SectionHeader
          title="Clients"
          subtitle={busy ? 'Loading…' : `${items.length} total`}
          right={
            <Button variant="secondary" disabled={busy} onClick={() => refresh()}>
              {busy ? 'Loading…' : 'Refresh'}
            </Button>
          }
        />
        <div className="mt-2">
          {items.length ? (
            items.map((c, idx) => (
              <ListRow
                key={c.id}
                title={c.name || 'Unnamed client'}
                subtitle={c.email}
                onClick={() => navigate(`/clients/${encodeURIComponent(c.id)}`)}
                showDivider={idx !== items.length - 1}
              />
            ))
          ) : (
            <div className="text-sm opacity-70 py-6">No clients yet.</div>
          )}
        </div>
        {error ? <div className="text-xs text-red-600 mt-3">{error}</div> : null}
      </Card>

      <StackModal open={createOpen} title="Add client" onClose={() => setCreateOpen(false)}>
        <FloatingLabelInput label="Client name" value={name} onChange={setName} />
        <FloatingLabelInput label="Email" value={email} onChange={setEmail} type="email" />
        <Button disabled={busy || !name.trim()} onClick={() => createClient()}>
          {busy ? 'Please wait…' : 'Create'}
        </Button>
      </StackModal>
    </WebScreen>
  );
}
