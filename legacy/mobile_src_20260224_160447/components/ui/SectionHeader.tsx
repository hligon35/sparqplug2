import React from "react";
import { View, Text, Pressable } from "react-native";

type Props = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  action?: React.ReactNode;
  onPressAction?: () => void;
  variant?: "plain" | "card";
  titleClassName?: string;
  subtitleClassName?: string;
};

export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  action,
  onPressAction,
  variant = "plain",
  titleClassName,
  subtitleClassName
}: Props) {
  const containerClassName =
    variant === "card"
      ? "-mx-4 -mt-4 px-4 pt-4 pb-3 rounded-t-2xl bg-gray-50 border-b border-gray-200 flex-row items-center justify-between"
      : "flex-row items-center justify-between";

  return (
    <View className={containerClassName}>
      <View className="flex-1 pr-3">
        <Text className={titleClassName ?? "text-base font-semibold"}>{title}</Text>
        {subtitle ? (
          <Text className={subtitleClassName ?? "text-sm opacity-70 mt-1"}>{subtitle}</Text>
        ) : null}
      </View>

      {action ? (
        onPressAction ? (
          <Pressable onPress={onPressAction} hitSlop={10}>
            {action}
          </Pressable>
        ) : (
          <View>{action}</View>
        )
      ) : actionLabel && onPressAction ? (
        <Pressable onPress={onPressAction} hitSlop={10}>
          <Text className="text-sm opacity-70">{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
