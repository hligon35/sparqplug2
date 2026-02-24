import React from 'react';
import { Text, View } from 'react-native';

import { ListRow } from './ListRow';

type Option = { label: string; value: string };

type Props = {
  label: string;
  value: string | null | undefined;
  options: Option[];
  onPress: () => void;
};

export function SelectField({ label, value, options, onPress }: Props) {
  const selected = options.find((o) => o.value === value);
  return (
    <View>
      <Text className="text-xs font-semibold opacity-70 mb-2">{label}</Text>
      <View className="rounded-2xl border border-gray-200 bg-white px-4">
        <ListRow title={selected?.label || 'Select…'} onPress={onPress} showDivider={false} />
      </View>
    </View>
  );
}
