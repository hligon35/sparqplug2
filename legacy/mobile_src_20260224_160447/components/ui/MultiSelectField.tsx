import React, { useMemo, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StackModal } from "./OverlayStack";
import { ModalSurface } from "./ModalSurface";
import type { SelectOption } from "./SelectField";

type Props = {
  label: string;
  values: string[];
  options: SelectOption[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
};

function uniq(values: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const v of values) {
    const s = String(v ?? "").trim();
    if (!s) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

export function MultiSelectField({ label, values, options, onChange, placeholder, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const instanceKey = useRef(`multiselect:${Date.now()}:${Math.random().toString(16).slice(2)}`).current;

  const selectedSet = useMemo(() => new Set((values || []).map((v) => String(v))), [values]);

  const display = useMemo(() => {
    const count = (values || []).filter((v) => String(v || "").trim()).length;
    if (count <= 0) return placeholder || "Select";
    if (count === 1) {
      const v = String(values[0]);
      const found = options.find((o) => o.value === v);
      return found?.label ?? v;
    }
    return `${count} selected`;
  }, [options, placeholder, values]);

  const effectiveOptions = useMemo(() => {
    const missing = (values || []).filter((v) => !options.some((o) => o.value === v));
    const prepended = missing.map((v) => ({ label: String(v), value: String(v) }));
    return [...prepended, ...options];
  }, [options, values]);

  function toggle(value: string) {
    const v = String(value);
    const next = new Set(selectedSet);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    onChange(uniq(Array.from(next)));
  }

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
          <Text className="font-semibold" style={{ position: "absolute", left: 14, top: 7, fontSize: 11, opacity: 0.75 }}>
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

      <StackModal overlayKey={`${instanceKey}:${label}`} visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 bg-black/50 px-4 justify-center" onPress={() => setOpen(false)}>
          <Pressable onPress={() => {}}>
            <ModalSurface title={label} subtitle="Tap to select multiple">
              <View className="p-4">
                <View>
                  {effectiveOptions.map((o) => {
                    const selected = selectedSet.has(o.value);
                    return (
                      <Pressable key={`${o.value}`} onPress={() => toggle(o.value)} className="py-4 border-b border-gray-100 flex-row items-center justify-between">
                        <Text className="text-base font-semibold" numberOfLines={1} ellipsizeMode="tail">
                          {o.label}
                        </Text>
                        <Ionicons name={selected ? "checkbox" : "square-outline"} size={22} color={selected ? "#111827" : "#9CA3AF"} />
                      </Pressable>
                    );
                  })}
                </View>

                <View className="flex-row justify-end mt-4">
                  <Pressable onPress={() => setOpen(false)} className="rounded-xl border border-gray-200 bg-white px-4 py-3" hitSlop={10}>
                    <Text className="text-sm font-semibold">Done</Text>
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
