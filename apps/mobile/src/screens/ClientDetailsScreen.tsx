import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { Screen } from '../components/ui/Screen';
import { Card } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { ListRow } from '../components/ui/ListRow';
import { StackModal } from '../components/ui/StackModal';
import { FloatingLabelInput } from '../components/ui/FloatingLabelInput';
import { Button } from '../components/ui/Button';

export function ClientDetailsScreen({ route, navigation }: any) {
  const clientId: string = route?.params?.clientId;
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const title = useMemo(() => (clientId ? `Client` : 'Client'), [clientId]);

  return (
    <Screen
      title={title}
      statusText={clientId ? `ID: ${clientId}` : null}
      headerRight={<Button label="Edit" variant="ghost" onPress={() => setEditOpen(true)} />}
    >
      <Card>
        <SectionHeader title="Navigation" subtitle="Client workspace" />
        <View className="mt-2">
          <ListRow title="Tasks" subtitle="View client tasks" onPress={() => navigation.navigate('Tasks')} />
          <ListRow title="Expenses" subtitle="Placeholder" onPress={() => {}} />
          <ListRow title="Reporting" subtitle="Placeholder" onPress={() => {}} />
          <ListRow title="Contract" subtitle="Placeholder" onPress={() => {}} showDivider={false} />
        </View>
      </Card>

      <Card>
        <SectionHeader title="Notes" subtitle="Notes feed (placeholder)" />
        <Text className="text-sm opacity-70 mt-3">NotesFeed will appear here.</Text>
      </Card>

      <Card>
        <SectionHeader title="Files" subtitle="File manager (placeholder)" />
        <Text className="text-sm opacity-70 mt-3">FileManager will appear here.</Text>
      </Card>

      <StackModal visible={editOpen} title="Edit client" onClose={() => setEditOpen(false)}>
        <FloatingLabelInput label="Client name" value={name} onChangeText={setName} />
        <FloatingLabelInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
        <Button label="Save" onPress={() => setEditOpen(false)} />
      </StackModal>
    </Screen>
  );
}
