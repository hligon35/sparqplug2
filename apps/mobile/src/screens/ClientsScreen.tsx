import React, { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { apiFetch } from '../utils/apiClient';
import { Screen } from '../components/ui/Screen';
import { Card } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { ListRow } from '../components/ui/ListRow';
import { Button } from '../components/ui/Button';
import { FloatingActionButton } from '../components/ui/FloatingActionButton';
import { StackModal } from '../components/ui/StackModal';
import { FloatingLabelInput } from '../components/ui/FloatingLabelInput';

type Client = { id: string; name?: string; email?: string };

export function ClientsScreen({ navigation }: any) {
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
    <Screen title="Clients" statusText={statusText} scroll={false}>
      <View className="flex-1">
        <Card>
          <SectionHeader
            title="Clients"
            subtitle={busy ? 'Loading…' : `${items.length} total`}
            right={<Button label="Refresh" variant="secondary" disabled={busy} onPress={() => refresh()} />}
          />
          <View className="mt-2">
            {items.length ? (
              items.map((c, idx) => (
                <ListRow
                  key={c.id}
                  title={c.name || 'Unnamed client'}
                  subtitle={c.email}
                  onPress={() => navigation.navigate('ClientDetails', { clientId: c.id })}
                  showDivider={idx !== items.length - 1}
                />
              ))
            ) : (
              <Text className="text-sm opacity-70 py-6">No clients yet.</Text>
            )}
          </View>

          {error ? <Text className="text-xs text-red-600 mt-3">{error}</Text> : null}
        </Card>

        <FloatingActionButton onPress={() => setCreateOpen(true)} />

        <StackModal visible={createOpen} title="Add client" onClose={() => setCreateOpen(false)}>
          <FloatingLabelInput label="Client name" value={name} onChangeText={setName} />
          <FloatingLabelInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
          <Button label={busy ? 'Please wait…' : 'Create'} disabled={busy} onPress={() => createClient()} />
        </StackModal>
      </View>
    </Screen>
  );
}
