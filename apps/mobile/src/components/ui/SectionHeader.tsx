import React from 'react';
import { Text, View } from 'react-native';

type Props = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
};

export function SectionHeader({ title, subtitle, right }: Props) {
  return (
    <View className="flex-row items-end justify-between">
      <View>
        <Text className="text-base font-semibold text-gray-900">{title}</Text>
        {subtitle ? <Text className="text-sm opacity-70">{subtitle}</Text> : null}
      </View>
      {right ? <View>{right}</View> : null}
    </View>
  );
}
