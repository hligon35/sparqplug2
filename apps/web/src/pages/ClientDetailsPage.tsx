import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { apiFetch } from '../utils/apiClient';

import { WebScreen } from '../components/ui/WebScreen';
import { Card } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { ListRow } from '../components/ui/ListRow';
import { Button } from '../components/ui/Button';
import { StackModal } from '../components/ui/StackModal';
import { FloatingLabelInput } from '../components/ui/FloatingLabelInput';

type Client = { id: string; name?: string; email?: string };

export function ClientDetailsPage() {
  const navigate = useNavigate();
  const { clientId } = useParams();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<Client | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const statusText = useMemo(() => (clientId ? `ID: ${clientId}` : null), [clientId]);

  async function refresh() {
    if (!clientId) return;
    setError(null);
    setBusy(true);
    try {
      const res = await apiFetch(`/clients/${encodeURIComponent(clientId)}`, { method: 'GET' });
      const c: Client | null = res?.item ?? res?.client ?? null;
      setClient(c);
      setName(c?.name ?? '');
      setEmail(c?.email ?? '');
    } catch (err: any) {
      setError(err?.message || 'Failed to load');
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!clientId) return;
    setError(null);
    setBusy(true);
    try {
      await apiFetch(`/clients/${encodeURIComponent(clientId)}`, {
        method: 'PUT',
        body: JSON.stringify({ name, email })
      });
      setEditOpen(false);
      await refresh();
    } catch (err: any) {
      setError(err?.message || 'Failed to save');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  return (
    <WebScreen
      title={client?.name ? 'Client' : 'Client'}
      statusText={statusText}
      headerRight={
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => navigate('/clients')}>
            Back
          </Button>
          <Button variant="secondary" disabled={busy} onClick={() => setEditOpen(true)}>
            Edit
          </Button>
        </div>
      }
    >
      <Card>
        <SectionHeader title="Navigation" subtitle="Client workspace" />
        <div className="mt-2">
          <ListRow title="Tasks" subtitle="View client tasks" onClick={() => navigate('/tasks')} />
          <ListRow title="Expenses" subtitle="Placeholder" onClick={() => {}} />
          <ListRow title="Reporting" subtitle="Placeholder" onClick={() => {}} />
          <ListRow title="Contract" subtitle="Placeholder" onClick={() => {}} showDivider={false} />
        </div>
      </Card>

      <Card>
        <SectionHeader title="Notes" subtitle="Notes feed (placeholder)" />
        <div className="text-sm opacity-70 mt-3">NotesFeed will appear here.</div>
      </Card>

      <Card>
        <SectionHeader title="Files" subtitle="File manager (placeholder)" />
        <div className="text-sm opacity-70 mt-3">FileManager will appear here.</div>
        {error ? <div className="text-xs text-red-600 mt-3">{error}</div> : null}
      </Card>

      <StackModal open={editOpen} title="Edit client" onClose={() => setEditOpen(false)}>
        <FloatingLabelInput label="Client name" value={name} onChange={setName} />
        <FloatingLabelInput label="Email" value={email} onChange={setEmail} type="email" />
        <Button disabled={busy || !name.trim()} onClick={() => save()}>
          {busy ? 'Please wait…' : 'Save'}
        </Button>
      </StackModal>
    </WebScreen>
  );
}
