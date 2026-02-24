import React from "react";
import { View, Text } from "react-native";

type Props = {
  title?: string;
  children?: React.ReactNode;
};

export function Card({ title, children }: Props) {
  return (
    <View className="rounded-2xl border border-gray-200 bg-white p-4">
      {title ? <Text className="text-base font-semibold mb-3">{title}</Text> : null}
      {children}
    </View>
  );
}
