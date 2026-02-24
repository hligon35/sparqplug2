import React, { useMemo, useState } from "react";
import { Text, TextInput, type TextInputProps, View } from "react-native";

type Props = Omit<TextInputProps, "value" | "onChangeText"> & {
  label: string;
  value: string;
  onChangeText: (next: string) => void;
  disabled?: boolean;
};

export function FloatingLabelInput({ label, value, onChangeText, disabled, style, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  const hasValue = String(value ?? "").length > 0;
  const floating = focused || hasValue;

  const placeholder = rest.placeholder;

  const labelStyle = useMemo(() => {
    return {
      position: "absolute" as const,
      left: 14,
      top: floating ? 7 : 16,
      fontSize: floating ? 11 : 14,
      opacity: floating ? 0.75 : 0.55
    };
  }, [floating]);

  return (
    <View
      className={disabled ? "rounded-xl border border-gray-200 bg-white opacity-40" : "rounded-xl border border-gray-200 bg-white"}
      style={{ position: "relative" }}
      accessibilityLabel={label}
    >
      <Text style={labelStyle} className="font-semibold">
        {label}
      </Text>
      <TextInput
        {...rest}
        value={value}
        onChangeText={onChangeText}
        editable={!disabled}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        className="px-3"
        style={[
          {
            paddingTop: 22,
            paddingBottom: 10,
            fontSize: 14
          },
          style
        ]}
        placeholder={floating ? placeholder : undefined}
      />
    </View>
  );
}
