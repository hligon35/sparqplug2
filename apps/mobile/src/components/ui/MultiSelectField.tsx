import React from 'react';
import { Text, View } from 'react-native';

import { ListRow } from './ListRow';

type Option = { label: string; value: string };

type Props = {
  label: string;
  values: string[];
  options: Option[];
  onPress: () => void;
};

export function MultiSelectField({ label, values, options, onPress }: Props) {
  const selected = options.filter((o) => values.includes(o.value)).map((o) => o.label);
  return (
    <View>
      <Text className="text-xs font-semibold opacity-70 mb-2">{label}</Text>
      <View className="rounded-2xl border border-gray-200 bg-white px-4">
        <ListRow title={selected.length ? selected.join(', ') : 'Select…'} onPress={onPress} showDivider={false} />
      </View>
    </View>
  );
}
