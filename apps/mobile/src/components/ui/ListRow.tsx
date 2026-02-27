import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { useDebug } from '../../hooks/useDebug';

type Props = {
  title: string;
  subtitle?: string;
  rightText?: string;
  onPress?: () => void;
  showDivider?: boolean;
};

export function ListRow({ title, subtitle, rightText, onPress, showDivider = true }: Props) {
  const debug = useDebug();
  const debugBounds = debug?.enabled && debug.toggles.showLayoutBounds;

  return (
    <Pressable
      onPress={onPress}
      className={`py-3 ${showDivider ? 'border-b border-gray-100' : ''} ${
        debugBounds ? 'border border-red-500 border-dashed' : ''
      }`}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-base font-semibold text-gray-900">{title}</Text>
          {subtitle ? <Text className="text-sm opacity-70">{subtitle}</Text> : null}
        </View>
        {rightText ? <Text className="text-sm opacity-70">{rightText}</Text> : null}
      </View>
    </Pressable>
  );
}
