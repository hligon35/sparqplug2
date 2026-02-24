import React, { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { apiFetch } from '../utils/apiClient';
import { Screen } from '../components/ui/Screen';
import { Card } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { ListRow } from '../components/ui/ListRow';
import { Button } from '../components/ui/Button';

type Note = { id: string; title?: string };

export function NotesScreen() {
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Note[]>([]);

  const statusText = useMemo(() => (offline ? 'Offline mode — changes may not sync' : null), [offline]);

  async function refresh() {
    setError(null);
    setBusy(true);
    try {
      const res = await apiFetch('/notes', { method: 'GET' });
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
    <Screen title="Notes" statusText={statusText} scroll={false}>
      <View className="flex-1">
        <Card>
          <SectionHeader
            title="Notes"
            subtitle={busy ? 'Loading…' : `${items.length} total`}
            right={<Button label="Refresh" variant="secondary" disabled={busy} onPress={() => refresh()} />}
          />
          <View className="mt-2">
            {items.length ? (
              items.map((n, idx) => (
                <ListRow key={n.id} title={n.title || 'Untitled note'} rightText={n.id.slice(0, 6)} showDivider={idx !== items.length - 1} />
              ))
            ) : (
              <Text className="text-sm opacity-70 py-6">No notes yet.</Text>
            )}
          </View>
          {error ? <Text className="text-xs text-red-600 mt-3">{error}</Text> : null}
        </Card>
      </View>
    </Screen>
  );
}
