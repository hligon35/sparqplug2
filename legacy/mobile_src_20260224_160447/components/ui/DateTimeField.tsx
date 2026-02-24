import React, { useMemo, useRef, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent
} from "@react-native-community/datetimepicker";
import { StackModal } from "./OverlayStack";
import { ModalSurface } from "./ModalSurface";

type Mode = "date" | "time" | "datetime" | "month";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatISODateLocal(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function formatMonthISO(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-01`;
}

function safeParseDate(value?: string | null): Date | null {
  if (!value) return null;
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function formatDisplay(value: string | null | undefined, mode: Mode): string {
  const dt = safeParseDate(value);
  if (!dt) return "";

  if (mode === "time") {
    return dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  if (mode === "datetime") {
    const date = dt.toLocaleDateString([], { year: "numeric", month: "short", day: "2-digit" });
    const time = dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return `${date} ${time}`;
  }

  if (mode === "month") {
    return dt.toLocaleDateString([], { year: "numeric", month: "long" });
  }

  return dt.toLocaleDateString([], { year: "numeric", month: "short", day: "2-digit" });
}

export type DateTimeFieldProps = {
  label: string;
  value: string;
  onChange: (next: string) => void;
  mode: Mode;
  placeholder?: string;
  allowClear?: boolean;
};

export default function DateTimeField({
  label,
  value,
  onChange,
  mode,
  placeholder,
  allowClear = true
}: DateTimeFieldProps) {
  const parsed = useMemo(() => safeParseDate(value) ?? new Date(), [value]);
  const [iosOpen, setIosOpen] = useState(false);
  const [draft, setDraft] = useState<Date>(parsed);
  const instanceKey = useRef(`datetime:${Date.now()}:${Math.random().toString(16).slice(2)}`).current;

  const display = useMemo(() => formatDisplay(value, mode), [value, mode]);

  function applyDate(dt: Date) {
    if (mode === "datetime") {
      onChange(dt.toISOString());
      return;
    }

    if (mode === "time") {
      onChange(dt.toISOString());
      return;
    }

    if (mode === "month") {
      onChange(formatMonthISO(dt));
      return;
    }

    onChange(formatISODateLocal(dt));
  }

  function openPicker() {
    if (Platform.OS === "android") {
      if (mode === "datetime") {
        DateTimePickerAndroid.open({
          value: parsed,
          mode: "date",
          onChange: (event: DateTimePickerEvent, date) => {
            if (event.type !== "set" || !date) return;
            const base = new Date(date);
            DateTimePickerAndroid.open({
              value: parsed,
              mode: "time",
              is24Hour: false,
              onChange: (e2: DateTimePickerEvent, t) => {
                if (e2.type !== "set" || !t) return;
                const next = new Date(base);
                next.setHours(t.getHours(), t.getMinutes(), 0, 0);
                applyDate(next);
              }
            });
          }
        });
        return;
      }

      DateTimePickerAndroid.open({
        value: parsed,
        mode: mode === "month" ? "date" : mode,
        onChange: (event: DateTimePickerEvent, date) => {
          if (event.type !== "set" || !date) return;
          applyDate(date);
        }
      });
      return;
    }

    setDraft(parsed);
    setIosOpen(true);
  }

  return (
    <View>
      <View className="flex-row items-stretch gap-2">
        <View className="flex-1 rounded-xl border border-gray-200 bg-white" style={{ position: "relative" }}>
          <Text
            className="font-semibold"
            style={{ position: "absolute", left: 14, top: 7, fontSize: 11, opacity: 0.75 }}
          >
            {label}
          </Text>
          <Pressable onPress={openPicker} className="px-3" style={{ paddingTop: 22, paddingBottom: 10 }} hitSlop={10}>
            <Text className={display ? "text-sm" : "text-sm opacity-50"}>
              {display || placeholder || "Select"}
            </Text>
          </Pressable>
        </View>

        {allowClear && value ? (
          <Pressable onPress={() => onChange("")} className="rounded-xl border border-gray-200 bg-white px-3 py-3" hitSlop={10}>
            <Text className="text-sm font-semibold">Clear</Text>
          </Pressable>
        ) : null}
      </View>

      <StackModal
        overlayKey={`${instanceKey}:${label}`}
        visible={iosOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIosOpen(false)}
      >
        <Pressable className="flex-1 bg-black/50 px-4 justify-center" onPress={() => setIosOpen(false)}>
          <Pressable onPress={() => {}}>
            <ModalSurface title={`Pick ${mode === "month" ? "month" : mode}`}>
              <View className="p-4">
                <View>
                  <DateTimePicker
                    value={draft}
                    mode={mode === "month" ? "date" : mode === "datetime" ? "datetime" : mode}
                    display="spinner"
                    onChange={(_, date) => {
                      if (date) setDraft(date);
                    }}
                  />
                </View>

                <View className="flex-row justify-end gap-2 mt-4">
                  <Pressable onPress={() => setIosOpen(false)} className="rounded-xl border border-gray-200 bg-white px-4 py-3" hitSlop={10}>
                    <Text className="text-sm font-semibold">Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      applyDate(draft);
                      setIosOpen(false);
                    }}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-3"
                    hitSlop={10}
                  >
                    <Text className="text-sm font-semibold">Done</Text>
                  </Pressable>
                </View>
              </View>
            </ModalSurface>
          </Pressable>
        </Pressable>
      </StackModal>
    </View>
  );
}
