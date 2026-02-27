import React, { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { apiFetch } from '../utils/apiClient';
import { Screen } from '../components/ui/Screen';
import { Card } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { ListRow } from '../components/ui/ListRow';
import { Button } from '../components/ui/Button';
import { FloatingActionButton } from '../components/ui/FloatingActionButton';

type Task = { id: string; title?: string; status?: 'todo' | 'doing' | 'done' };

export function TasksScreen({ navigation }: any) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [items, setItems] = useState<Task[]>([]);

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

  useEffect(() => {
    refresh();
  }, []);

  const statusText = offline ? 'Offline mode — changes may not sync' : null;

  return (
    <Screen title="Tasks" statusText={statusText} scroll={false}>
      <View className="flex-1">
        <Card>
          <SectionHeader
            title="Status"
            subtitle={busy ? 'Loading…' : offline ? 'Offline' : 'Online'}
            right={
              <Button
                label={busy ? 'Loading…' : offline ? 'Retry' : 'Sync'}
                variant="secondary"
                disabled={busy}
                onPress={() => refresh()}
              />
            }
          />
        </Card>

        <Card>
          <SectionHeader title="Active" subtitle={`${active.length} tasks`} />
          <View className="mt-2">
            {active.length ? (
              active.map((t, idx) => (
                <ListRow
                  key={t.id}
                  title={t.title || 'Untitled task'}
                  subtitle={t.status || 'todo'}
                  onPress={() => navigation.navigate('TaskDetail', { taskId: t.id })}
                  showDivider={idx !== active.length - 1}
                />
              ))
            ) : (
              <Text className="text-sm opacity-70 py-6">No active tasks.</Text>
            )}
          </View>
        </Card>

        <Card>
          <SectionHeader title="Completed" subtitle={`${completed.length} tasks`} />
          <View className="mt-2">
            {completed.length ? (
              completed.map((t, idx) => (
                <ListRow
                  key={t.id}
                  title={t.title || 'Untitled task'}
                  subtitle="done"
                  onPress={() => navigation.navigate('TaskDetail', { taskId: t.id })}
                  showDivider={idx !== completed.length - 1}
                />
              ))
            ) : (
              <Text className="text-sm opacity-70 py-6">No completed tasks.</Text>
            )}
          </View>
          {error ? <Text className="text-xs text-red-600 mt-3">{error}</Text> : null}
        </Card>

        <FloatingActionButton onPress={() => navigation.navigate('TaskEdit', {})} />
      </View>
    </Screen>
  );
}
