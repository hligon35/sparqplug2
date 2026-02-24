import React from "react";
import { Pressable, Text, View } from "react-native";

type Option = {
  label: string;
  value: string;
};

type Props = {
  label?: string;
  value: string;
  options: Option[];
  onChange: (next: string) => void;
};

export function ChipSelect({ label, value, options, onChange }: Props) {
  return (
    <View>
      {label ? <Text className="text-xs opacity-70 mb-2">{label}</Text> : null}
      <View className="flex-row flex-wrap gap-2">
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onChange(opt.value)}
              className={`px-2 py-1 rounded-full border ${
                active ? "bg-gray-900 border-gray-900" : "border-gray-200 bg-white"
              }`}
            >
              <Text className={`text-xs ${active ? "text-white" : "opacity-70"}`}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
