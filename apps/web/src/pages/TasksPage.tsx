import { WebScreen } from '../components/ui/WebScreen';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiFetch } from '../utils/apiClient';

import { Card } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { ListRow } from '../components/ui/ListRow';
import { Badge } from '../components/ui/Badge';
import { StackModal } from '../components/ui/StackModal';
import { FloatingLabelInput } from '../components/ui/FloatingLabelInput';
import { Button } from '../components/ui/Button';

type Task = { id: string; title?: string; status?: 'todo' | 'doing' | 'done' };

export function TasksPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [items, setItems] = useState<Task[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const active = useMemo(() => items.filter((t) => t.status !== 'done'), [items]);
  const completed = useMemo(() => items.filter((t) => t.status === 'done'), [items]);

  async function refresh() {
    setError(null);
    setBusy(true);
    try {
      const res = await apiFetch('/tasks', { method: 'GET' });
      setItems(res?.items ?? []);
      setOffline(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to load');
      setOffline(true);
    } finally {
      setBusy(false);
    }
  }

  async function createTask() {
    setError(null);
    setBusy(true);
    try {
      await apiFetch('/tasks', {
        method: 'POST',
        body: JSON.stringify({ title, description, status: 'todo' })
      });
      setCreateOpen(false);
      setTitle('');
      setDescription('');
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

  const statusText = offline ? 'Offline mode — changes may not sync' : null;

  return (
    <WebScreen
      title="Tasks"
      statusText={statusText}
      headerRight={
        <Button variant="secondary" disabled={busy} onClick={() => setCreateOpen(true)}>
          Add
        </Button>
      }
    >
      <Card>
        <div className="flex items-center justify-between">
          <div className="text-sm opacity-70">{busy ? 'Loading…' : 'Status'}</div>
          <button type="button" disabled={busy} onClick={() => refresh()}>
            <Badge label={busy ? 'Loading…' : 'Sync'} variant={offline ? 'danger' : 'indigo'} />
          </button>
        </div>
      </Card>

      <Card>
        <SectionHeader title="Active" subtitle={`${active.length} tasks`} />
        <div className="mt-2">
          {active.length ? (
            active.map((t, idx) => (
              <ListRow
                key={t.id}
                title={t.title || 'Untitled task'}
                subtitle={t.status || 'todo'}
                onClick={() => navigate(`/tasks/${encodeURIComponent(t.id)}`)}
                showDivider={idx !== active.length - 1}
              />
            ))
          ) : (
            <div className="text-sm opacity-70 py-6">No active tasks.</div>
          )}
        </div>
      </Card>

      <Card>
        <SectionHeader title="Completed" subtitle={`${completed.length} tasks`} />
        <div className="mt-2">
          {completed.length ? (
            completed.map((t, idx) => (
              <ListRow
                key={t.id}
                title={t.title || 'Untitled task'}
                subtitle="done"
                onClick={() => navigate(`/tasks/${encodeURIComponent(t.id)}`)}
                showDivider={idx !== completed.length - 1}
              />
            ))
          ) : (
            <div className="text-sm opacity-70 py-6">No completed tasks.</div>
          )}
        </div>
        {error ? <div className="text-xs text-red-600 mt-3">{error}</div> : null}
      </Card>

      <StackModal open={createOpen} title="Add task" onClose={() => setCreateOpen(false)}>
        <FloatingLabelInput label="Title" value={title} onChange={setTitle} />
        <FloatingLabelInput label="Description" value={description} onChange={setDescription} textarea />
        <Button disabled={busy || !title.trim()} onClick={() => createTask()}>
          {busy ? 'Please wait…' : 'Create'}
        </Button>
      </StackModal>
    </WebScreen>
  );
}
