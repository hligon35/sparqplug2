import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../utils/apiClient';

import { Card } from './ui/Card';
import { SectionHeader } from './ui/SectionHeader';
import { Button } from './ui/Button';
import { FloatingLabelInput } from './ui/FloatingLabelInput';

type Props = {
  title: string;
  resourcePath: string;
  createExample?: Record<string, unknown>;
  showHeader?: boolean;
};

export function CrudResourcePage({ title, resourcePath, createExample, showHeader = true }: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createJson, setCreateJson] = useState(() =>
    JSON.stringify(createExample ?? { name: 'Example' }, null, 2)
  );
  const [deleteId, setDeleteId] = useState('');

  const prettyItems = useMemo(() => JSON.stringify(items, null, 2), [items]);

  async function refresh() {
    setError(null);
    setBusy(true);
    try {
      const res = await apiFetch(resourcePath, { method: 'GET' });
      setItems(res?.items ?? []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load');
    } finally {
      setBusy(false);
    }
  }

  async function createItem() {
    setError(null);
    setBusy(true);
    try {
      const body = JSON.parse(createJson);
      await apiFetch(resourcePath, {
        method: 'POST',
        body: JSON.stringify(body)
      });
      await refresh();
    } catch (err: any) {
      setError(err?.message || 'Failed to create');
    } finally {
      setBusy(false);
    }
  }

  async function deleteItem() {
    if (!deleteId.trim()) return;
    setError(null);
    setBusy(true);
    try {
      await apiFetch(`${resourcePath}/${encodeURIComponent(deleteId.trim())}`, {
        method: 'DELETE'
      });
      setDeleteId('');
      await refresh();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourcePath]);

  return (
    <div className="flex flex-col gap-4">
      {showHeader ? (
        <Card>
          <SectionHeader
            title={title}
            subtitle={resourcePath}
            right={<Button disabled={busy} onClick={() => refresh()}>{busy ? 'Loading…' : 'Refresh'}</Button>}
          />
        </Card>
      ) : null}

      <Card>
        <SectionHeader title="Create" subtitle="JSON payload" />
        <div className="mt-3">
          <textarea
            value={createJson}
            onChange={(e) => setCreateJson(e.target.value)}
            rows={8}
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 font-mono text-sm"
          />
        </div>
        <div className="mt-3">
          <Button disabled={busy} onClick={() => createItem()}>
            Create
          </Button>
        </div>
      </Card>

      <Card>
        <SectionHeader title="Delete" subtitle="By document ID" />
        <div className="mt-3 flex flex-col gap-3">
          <FloatingLabelInput label="Document ID" value={deleteId} onChange={setDeleteId} />
          <Button disabled={busy || !deleteId.trim()} variant="secondary" onClick={() => deleteItem()}>
            Delete
          </Button>
        </div>
      </Card>

      <Card>
        <SectionHeader title="Items" subtitle={`${items.length} total`} />
        <pre className="mt-3 rounded-2xl border border-gray-200 bg-white p-4 overflow-x-auto text-sm">{prettyItems}</pre>
        {error ? <div className="mt-3 text-xs text-red-600">{error}</div> : null}
      </Card>
    </div>
  );
}
