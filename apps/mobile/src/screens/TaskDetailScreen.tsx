import React from 'react';
import { Text } from 'react-native';

import { Screen } from '../components/ui/Screen';
import { Card } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';

export function TaskDetailScreen({ route }: any) {
  const taskId: string = route?.params?.taskId;
  return (
    <Screen title="Task" statusText={taskId ? `ID: ${taskId}` : null}>
      <Card>
        <SectionHeader title="Details" subtitle="Placeholder" />
        <Text className="text-sm opacity-70 mt-4">Task details view will appear here.</Text>
      </Card>
    </Screen>
  );
}
