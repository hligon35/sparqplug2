import React, { useState } from 'react';
import { View } from 'react-native';

import { Screen } from '../components/ui/Screen';
import { Card } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { FloatingLabelInput } from '../components/ui/FloatingLabelInput';
import { Button } from '../components/ui/Button';

export function TaskEditScreen({ navigation }: any) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  return (
    <Screen title="Edit task">
      <Card>
        <SectionHeader title="Task" subtitle="Placeholder editor" />
        <View className="mt-4 gap-3">
          <FloatingLabelInput label="Title" value={title} onChangeText={setTitle} />
          <FloatingLabelInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
          <Button label="Save" onPress={() => navigation.goBack()} />
        </View>
      </Card>
    </Screen>
  );
}
