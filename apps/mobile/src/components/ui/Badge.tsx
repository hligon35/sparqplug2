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
      ? 'bg-[#DC2626]'
      : variant === 'indigo'
        ? 'bg-[#4F46E5]'
        : 'bg-gray-200';

  const textClassName = variant === 'default' ? 'text-[#111827]' : 'text-white';

  return (
    <View className={`rounded-full px-3 py-1 ${className}`}>
      <Text className={`text-xs font-semibold ${textClassName}`}>{label}</Text>
    </View>
  );
}
