import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { apiFetch } from '../utils/apiClient';

import { WebScreen } from '../components/ui/WebScreen';
import { Card } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Button } from '../components/ui/Button';

type Task = { id: string; title?: string; status?: 'todo' | 'doing' | 'done'; description?: string };

export function TaskDetailPage() {
  const navigate = useNavigate();
  const { taskId } = useParams();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [task, setTask] = useState<Task | null>(null);

  const statusText = useMemo(() => (taskId ? `ID: ${taskId}` : null), [taskId]);

  useEffect(() => {
    async function load() {
      if (!taskId) return;
      setError(null);
      setBusy(true);
      try {
        const res = await apiFetch(`/tasks/${encodeURIComponent(taskId)}`, { method: 'GET' });
        const t: Task | null = res?.item ?? res?.task ?? null;
        setTask(t);
      } catch (err: any) {
        setError(err?.message || 'Failed to load');
      } finally {
        setBusy(false);
      }
    }
    load();
  }, [taskId]);

  return (
    <WebScreen
      title="Task"
      statusText={statusText}
      headerRight={
        <Button variant="ghost" onClick={() => navigate('/tasks')}>
          Back
        </Button>
      }
    >
      <Card>
        <SectionHeader title="Details" subtitle="Placeholder" />
        <div className="text-sm opacity-70 mt-3">
          {busy ? 'Loading…' : 'Task details view will appear here.'}
        </div>
        {task?.title ? <div className="mt-3 text-sm">Title: {task.title}</div> : null}
        {task?.status ? <div className="mt-1 text-sm">Status: {task.status}</div> : null}
        {error ? <div className="text-xs text-red-600 mt-3">{error}</div> : null}
      </Card>
    </WebScreen>
  );
}
