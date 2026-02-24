import React, { useEffect, useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { Card, Screen } from "../components/ui";
import { useSession } from "../hooks/useSession";
import { sessionStore } from "../services/sessionStore";

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "phone-pad" | "decimal-pad";
};

function Field({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType }: FieldProps) {
  return (
    <View className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
      <Text className="text-sm font-semibold opacity-60">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        className="text-base mt-1"
        autoCapitalize={label === "Email" ? "none" : "words"}
        keyboardType={keyboardType}
      />
    </View>
  );
}

export default function ProfileScreen() {
  const { user, loading, error } = useSession();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setName(String(user.name ?? ""));
    setEmail(String(user.email ?? ""));
  }, [user?.id]);

  useEffect(() => {
    if (!user && !loading) {
      void sessionStore.refresh();
    }
  }, [user, loading]);

  const canSave = useMemo(() => {
    return name.trim().length > 0 && email.trim().length > 0;
  }, [name, email]);

  async function onSave() {
    if (!canSave) return;
    try {
      setStatus(null);
      await sessionStore.updateMe({ name: name.trim(), email: email.trim() });
      setStatus("Saved");
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to save profile");
    }
  }

  return (
    <Screen>
      <View className="rounded-3xl border border-gray-200 bg-white/90 p-5">
        <Text className="text-lg font-semibold">{user?.name ?? user?.username ?? "Profile"}</Text>
        <Text className="text-sm opacity-70 mt-1">{user?.email ?? ""}</Text>
        {error ? <Text className="text-xs text-red-600 mt-2">{error}</Text> : null}
        {status ? <Text className="text-xs opacity-70 mt-2">{status}</Text> : null}
      </View>

      <Card title="Profile">
        <View className="gap-3">
          <Field label="Name" value={name} onChangeText={setName} placeholder="" />
          <Field label="Email" value={email} onChangeText={setEmail} placeholder="" />

          <View className="flex-row justify-end">
            <Pressable
              onPress={onSave}
              disabled={!canSave || loading}
              className={
                !canSave || loading
                  ? "rounded-full bg-black/90 px-5 py-3 opacity-40"
                  : "rounded-full bg-black/90 px-5 py-3"
              }
              hitSlop={10}
            >
              <Text className="text-sm font-semibold text-white">Save</Text>
            </Pressable>
          </View>
        </View>
      </Card>
    </Screen>
  );
}
