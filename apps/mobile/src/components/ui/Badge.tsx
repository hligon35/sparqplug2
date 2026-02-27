import React from 'react';
import { Text, View } from 'react-native';

type Variant = 'default' | 'danger' | 'indigo';

type Props = {
  label: string;
  variant?: Variant;
};

export function Badge({ label, variant = 'default' }: Props) {
  const className =
    variant === 'danger'
      ? 'bg-red-600'
      : variant === 'indigo'
        ? 'bg-indigo-600'
        : 'bg-gray-200';

  const textClassName = variant === 'default' ? 'text-gray-900' : 'text-white';

  return (
    <View className={`rounded-full px-3 py-1 ${className}`}>
      <Text className={`text-xs font-semibold ${textClassName}`}>{label}</Text>
    </View>
  );
}
