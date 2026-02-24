import React from 'react';
import { Pressable, Text, View } from 'react-native';

type Props = {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function ModalSurface({ title, onClose, children }: Props) {
  return (
    <View className="rounded-3xl bg-white border border-gray-200 overflow-hidden">
      <View className="px-4 py-3 flex-row items-center justify-between border-b border-gray-100">
        <Text className="text-base font-semibold text-[#111827]">{title}</Text>
        <Pressable onPress={onClose} className="px-3 py-2">
          <Text className="font-semibold">Close</Text>
        </Pressable>
      </View>
      <View className="p-4 gap-3">{children}</View>
    </View>
  );
}
