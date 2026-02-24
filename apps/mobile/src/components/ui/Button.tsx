import React from 'react';
import { Pressable, Text, View } from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: Variant;
  right?: React.ReactNode;
};

export function Button({ label, onPress, disabled, variant = 'primary', right }: Props) {
  const base = 'rounded-2xl px-4 py-3 flex-row items-center justify-center';
  const variantClass =
    variant === 'primary'
      ? 'bg-[#4F46E5]'
      : variant === 'secondary'
        ? 'bg-white border border-gray-200'
        : 'bg-transparent';
  const textClass =
    variant === 'primary' ? 'text-white' : variant === 'secondary' ? 'text-[#111827]' : 'text-[#111827]';
  const disabledClass = disabled ? 'opacity-50' : '';

  return (
    <Pressable disabled={disabled} onPress={onPress} className={`${base} ${variantClass} ${disabledClass}`}>
      <View className="flex-row items-center gap-2">
        <Text className={`font-semibold ${textClass}`}>{label}</Text>
        {right ? <View>{right}</View> : null}
      </View>
    </Pressable>
  );
}
