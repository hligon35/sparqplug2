import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

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

function CardHeader({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-lg font-bold text-gray-900">{title}</Text>
      {actionLabel ? (
        <Pressable onPress={onAction} className="px-2 py-1">
          <Text className="text-base font-semibold opacity-70">{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ClientDetailsScreen({ route, navigation }: any) {
  const clientId: string = route?.params?.clientId;

  return (
    <Screen
      title="Client"
      headerLeft={<HeaderIconButton icon="chevron-back" onPress={() => navigation.goBack()} />}
      headerRight={<HeaderIconButton icon="person-outline" onPress={() => navigation.navigate('Profile')} />}
    >
      <Pressable
        onPress={() => {}}
        className="rounded-full border border-gray-200 bg-white px-5 py-4"
      >
        <Text className="text-sm opacity-70">{clientId ? 'Select a business' : 'Select a business'}</Text>
      </Pressable>

      <Card className="p-5">
        <CardHeader title="Website Analytics" />
        <Text className="text-base opacity-70 mt-4">Select a business to view website analytics.</Text>
      </Card>

      <Card className="p-5">
        <CardHeader title="Social Media Analytics" />
        <Text className="text-base opacity-70 mt-4">Select a business to view social analytics.</Text>
      </Card>

      <Card className="p-5">
        <CardHeader title="Notes" actionLabel="Add" onAction={() => {}} />
        <Text className="text-base opacity-70 mt-4">No notes yet.</Text>
      </Card>

      <Card className="p-5">
        <CardHeader title="Checklist" actionLabel="Add" onAction={() => {}} />
        <Text className="text-base opacity-70 mt-4">No checklist items yet.</Text>
      </Card>

      <Card className="p-5">
        <CardHeader title="Files" actionLabel="Upload" onAction={() => {}} />
        <Text className="text-base opacity-70 mt-4">No files yet.</Text>
      </Card>
    </Screen>
  );
}
