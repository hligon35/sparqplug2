import React from "react";
import { ScrollView, View, Text, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  title?: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  scroll?: boolean;
};

export function ModalSurface({ title, subtitle, headerRight, children, scroll = true }: Props) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  const maxHeight = Math.max(320, windowHeight - (insets.top + insets.bottom + 32));
  const bottomPadding = Math.max(16, insets.bottom);

  return (
    <View
      className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
      style={{ maxHeight }}
    >
      {title ? (
        <View className="px-5 pt-5 pb-3 border-b border-gray-100">
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1" style={{ minWidth: 0 }}>
              <Text className="text-xl font-semibold" numberOfLines={1} ellipsizeMode="tail">
                {title}
              </Text>
              {subtitle ? (
                <Text className="text-xs opacity-70 mt-1" numberOfLines={2} ellipsizeMode="tail">
                  {subtitle}
                </Text>
              ) : null}
            </View>
            {headerRight ? <View>{headerRight}</View> : null}
          </View>
        </View>
      ) : null}

      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: bottomPadding }}
        >
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </View>
  );
}
