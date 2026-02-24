import React from "react";
import { Pressable, View, Text } from "react-native";

type Props = {
  title: string;
  subtitle?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  onPress?: () => void;
  titleClassName?: string;
  subtitleClassName?: string;
};

export function ListRow({ title, subtitle, left, right, onPress, titleClassName, subtitleClassName }: Props) {
  const Container: any = onPress ? Pressable : View;

  return (
    <Container
      onPress={onPress}
      className="py-3 flex-row items-center justify-between border-b border-gray-100"
    >
      {left ? <View className="mr-3">{left}</View> : null}
      <View className="flex-1 pr-3">
        <Text className={titleClassName ?? "text-base font-semibold"}>{title}</Text>
        {subtitle ? (
          <Text className={subtitleClassName ?? "text-sm opacity-70 mt-1"}>{subtitle}</Text>
        ) : null}
      </View>
      {right ? <View>{right}</View> : null}
    </Container>
  );
}
