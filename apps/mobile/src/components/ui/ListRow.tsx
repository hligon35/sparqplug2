import React from 'react';
import { Pressable, Text, View } from 'react-native';

type Props = {
  title: string;
  subtitle?: string;
  rightText?: string;
  onPress?: () => void;
  showDivider?: boolean;
};

export function ListRow({ title, subtitle, rightText, onPress, showDivider = true }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className={`py-3 ${showDivider ? 'border-b border-gray-100' : ''}`}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-base font-semibold text-[#111827]">{title}</Text>
          {subtitle ? <Text className="text-sm opacity-70">{subtitle}</Text> : null}
        </View>
        {rightText ? <Text className="text-sm opacity-70">{rightText}</Text> : null}
      </View>
    </Pressable>
  );
}
