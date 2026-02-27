import React from 'react';
import { Pressable, Text, View } from 'react-native';

export function FloatingActionButton({ label = '+', onPress }: { label?: string; onPress: () => void }) {
  return (
    <View className="absolute bottom-6 right-6">
      <Pressable
        onPress={onPress}
        className="rounded-full bg-indigo-600 items-center justify-center"
        style={{ width: 56, height: 56 }}
      >
        <Text className="text-white text-2xl font-bold">{label}</Text>
      </Pressable>
    </View>
  );
}
