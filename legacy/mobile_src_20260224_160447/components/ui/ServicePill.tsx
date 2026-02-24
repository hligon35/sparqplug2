import React from "react";
import { Pressable, Text, View } from "react-native";

type Props = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
};

export function ServicePill({ label, onPress, disabled }: Props) {
  const isDisabled = disabled || !onPress;
  const Container: any = !isDisabled ? Pressable : View;

  return (
    <Container
      onPress={!isDisabled ? onPress : undefined}
      hitSlop={!isDisabled ? 10 : undefined}
      accessibilityRole={!isDisabled ? "button" : undefined}
      className={
        isDisabled
          ? "rounded-full border border-gray-200 bg-gray-50 px-4 py-2 opacity-50"
          : "rounded-full border border-gray-200 bg-gray-50 px-4 py-2"
      }
    >
      <Text numberOfLines={1} className="text-xs font-semibold opacity-80">
        {label}
      </Text>
    </Container>
  );
}
