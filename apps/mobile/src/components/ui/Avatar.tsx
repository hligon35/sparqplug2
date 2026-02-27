import React from 'react';
import { Text, View } from 'react-native';

export function Avatar({ label }: { label: string }) {
  const initial = (label || '?').trim().slice(0, 1).toUpperCase();
  return (
    <View className="rounded-full bg-gray-200 items-center justify-center" style={{ width: 36, height: 36 }}>
      <Text className="font-bold text-gray-900">{initial}</Text>
    </View>
  );
}
