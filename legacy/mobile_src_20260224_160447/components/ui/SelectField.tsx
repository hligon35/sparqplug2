import React, { useMemo, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StackModal } from "./OverlayStack";
import { ModalSurface } from "./ModalSurface";

export type SelectOption = { label: string; value: string };

type Props = {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export function SelectField({ label, value, options, onChange, placeholder, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const instanceKey = useRef(`select:${Date.now()}:${Math.random().toString(16).slice(2)}`).current;

  const selectedLabel = useMemo(() => {
    const found = options.find((o) => o.value === value);
    return found?.label ?? value;
  }, [options, value]);

  const display = selectedLabel || placeholder || "Select";

  const effectiveOptions = useMemo(() => {
    const hasValue = String(value ?? "").trim().length > 0;
    const valueExists = options.some((o) => o.value === value);
    if (hasValue && !valueExists) {
      return [{ label: String(value), value: String(value) }, ...options];
    }
    return options;
  }, [options, value]);

  return (
    <>
      <Pressable
        onPress={() => {
          if (disabled) return;
          setOpen(true);
        }}
        hitSlop={10}
        className={disabled ? "rounded-2xl border border-gray-200 bg-white opacity-40" : "rounded-2xl border border-gray-200 bg-white"}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <View className="flex-row items-center px-3" style={{ position: "relative" }}>
          <Text
            className="font-semibold"
            style={{ position: "absolute", left: 14, top: 7, fontSize: 11, opacity: 0.75 }}
          >
            {label}
          </Text>
          <View className="flex-1 pr-3" style={{ minWidth: 0, paddingTop: 22, paddingBottom: 10 }}>
            <Text className={display ? "text-sm" : "text-sm opacity-50"} numberOfLines={1} ellipsizeMode="tail">
              {display}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={18} color="#6B7280" />
        </View>
      </Pressable>

      <StackModal
        overlayKey={`${instanceKey}:${label}`}
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable className="flex-1 bg-black/50 px-4 justify-center" onPress={() => setOpen(false)}>
          <Pressable onPress={() => {}}>
            <ModalSurface title={label}>
              <View className="p-4">
                <View>
                  {effectiveOptions.map((o) => (
                    <Pressable
                      key={`${o.value}`}
                      onPress={() => {
                        onChange(o.value);
                        setOpen(false);
                      }}
                      className="py-4 border-b border-gray-100"
                    >
                      <Text className="text-base font-semibold">{o.label}</Text>
                    </Pressable>
                  ))}
                </View>
                <View className="flex-row justify-end mt-4">
                  <Pressable
                    onPress={() => setOpen(false)}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-3"
                    hitSlop={10}
                  >
                    <Text className="text-sm font-semibold">Close</Text>
                  </Pressable>
                </View>
              </View>
            </ModalSurface>
          </Pressable>
        </Pressable>
      </StackModal>
    </>
  );
}
