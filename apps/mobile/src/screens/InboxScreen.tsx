import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text } from 'react-native';

import { Screen } from '../components/ui/Screen';
import { Card } from '../components/ui/Card';

function HeaderIconButton({ icon, onPress }: { icon: any; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="w-12 h-12 items-center justify-center rounded-full bg-white border border-gray-200"
    >
      <Ionicons name={icon} size={22} color="black" />
    </Pressable>
  );
}

export function InboxScreen({ navigation }: any) {
  return (
    <Screen title="Inbox" headerRight={<HeaderIconButton icon="person-outline" onPress={() => navigation.navigate('Profile')} />}>
      <Card>
        <Text className="text-base font-bold text-gray-900">Inbox</Text>
        <Text className="text-sm opacity-70 mt-2">Coming soon.</Text>
      </Card>
    </Screen>
  );
}
