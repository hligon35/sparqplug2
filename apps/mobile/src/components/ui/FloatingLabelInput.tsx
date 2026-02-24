import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address';
  multiline?: boolean;
  numberOfLines?: number;
  rightAffordance?: React.ReactNode;
};

export function FloatingLabelInput({
  label,
  value,
  onChangeText,
  secureTextEntry,
  autoCapitalize = 'none',
  keyboardType,
  multiline,
  numberOfLines,
  rightAffordance
}: Props) {
  const [focused, setFocused] = useState(false);
  const showFloat = focused || value.length > 0;

  const containerClass = useMemo(
    () => `rounded-2xl border border-gray-200 bg-white px-4 ${multiline ? 'py-3' : 'py-4'}`,
    [multiline]
  );

  return (
    <View className={containerClass}>
      <View className="flex-row items-center">
        <View className="flex-1">
          <Text
            className={
              showFloat
                ? 'text-xs font-semibold opacity-70 mb-1'
                : 'text-xs font-semibold opacity-0 h-0'
            }
          >
            {label}
          </Text>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={showFloat ? '' : label}
            secureTextEntry={secureTextEntry}
            autoCapitalize={autoCapitalize}
            keyboardType={keyboardType}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            multiline={multiline}
            numberOfLines={numberOfLines}
            className="text-base text-[#111827]"
          />
        </View>
        {rightAffordance ? <View className="pl-3">{rightAffordance}</View> : null}
      </View>
    </View>
  );
}
