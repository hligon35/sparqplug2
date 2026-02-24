import React from "react";
import { Animated, Pressable, Text, View } from "react-native";

type Props = {
  label: string;
  valueText: string;
  placeholder?: string;
  onPress: () => void;
};

// Slightly higher float position to avoid overlapping placeholder/value text
// on smaller font scales and Android.
const FLOAT_TOP = 2;
const REST_TOP = 16;

export function FloatingLabelSelect({ label, valueText, placeholder, onPress }: Props) {
  const hasValue = String(valueText || "").trim().length > 0;
  // Selects don't have a focus state like TextInput. If we let the label rest,
  // it will visually overlap with the placeholder/value text.
  const shouldFloat = true;

  const anim = React.useRef(new Animated.Value(shouldFloat ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(anim, {
      toValue: shouldFloat ? 1 : 0,
      duration: 140,
      useNativeDriver: false
    }).start();
  }, [anim, shouldFloat]);

  const labelStyle = {
    top: anim.interpolate({
      inputRange: [0, 1],
      outputRange: [REST_TOP, FLOAT_TOP]
    }),
    fontSize: anim.interpolate({
      inputRange: [0, 1],
      outputRange: [14, 11]
    })
  } as const;

  const display = hasValue ? valueText : (placeholder ?? "Select");

  return (
    <Pressable onPress={onPress} className="rounded-xl border border-gray-200 bg-white px-3 py-3">
      <View className="relative">
        <Animated.Text
          className="absolute left-0 text-gray-500"
          pointerEvents="none"
          style={labelStyle as any}
        >
          {label}
        </Animated.Text>
        <View className="pt-6 flex-row items-center justify-between">
          <Text className={hasValue ? "text-base" : "text-base text-gray-500"}>{display}</Text>
          <Text className="text-gray-500">▾</Text>
        </View>
      </View>
    </Pressable>
  );
}
