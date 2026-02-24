import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../utils/apiClient';

type Props = {
  title: string;
  resourcePath: string;
  createExample?: Record<string, unknown>;
};

export function CrudResourcePage({ title, resourcePath, createExample }: Props) {
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
    <div style={{ maxWidth: 900 }}>
      <h1>{title}</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button disabled={busy} onClick={() => refresh()}>
          {busy ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      <h2 style={{ fontSize: 16 }}>Create</h2>
      <textarea
        value={createJson}
        onChange={(e) => setCreateJson(e.target.value)}
        rows={8}
        style={{ width: '100%', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button disabled={busy} onClick={() => createItem()}>
          Create
        </button>
      </div>

      <h2 style={{ fontSize: 16, marginTop: 20 }}>Delete</h2>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          placeholder="Document ID"
          value={deleteId}
          onChange={(e) => setDeleteId(e.target.value)}
          style={{ width: 320 }}
        />
        <button disabled={busy || !deleteId.trim()} onClick={() => deleteItem()}>
          Delete
        </button>
      </div>

      <h2 style={{ fontSize: 16, marginTop: 20 }}>Items</h2>
      <pre
        style={{
          background: '#fafafa',
          border: '1px solid #eee',
          padding: 12,
          overflowX: 'auto'
        }}
      >
        {prettyItems}
      </pre>

      {error ? <div style={{ marginTop: 12, color: 'crimson' }}>{error}</div> : null}
    </div>
  );
}
