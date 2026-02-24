import React from "react";
import { View, Text } from "react-native";

type Props = {
  label: string;
};

export function Badge({ label }: Props) {
  return (
    <View className="px-2 py-1 rounded-full border border-gray-200">
      <Text className="text-xs opacity-70">{label}</Text>
    </View>
  );
}
