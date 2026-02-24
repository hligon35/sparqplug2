import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Card, FloatingLabelInput, SectionHeader } from "../components/ui";
import { signIn, signUp } from "../services/auth";

type Props = {
  onDone?: () => void;
};

export default function LoginScreen({ onDone }: Props) {
  const insets = useSafeAreaInsets();
  const [isSignup, setIsSignup] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit() {
    if (isLoading) return;
    setError(null);
    setIsLoading(true);

    try {
      const username = email.trim();
      if (!username || !password) {
        throw new Error("Email and password are required");
      }

      if (isSignup) {
        if (!name.trim()) {
          throw new Error("Name is required");
        }
        await signUp(name.trim(), username, password);
      } else {
        await signIn(username, password);
      }

      onDone?.();
    } catch (e: any) {
      const data = e?.response?.data;
      const msg =
        (typeof data?.detail === "string" && data.detail) ||
        (data ? JSON.stringify(data) : null) ||
        e?.message ||
        String(e);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View
      className="flex-1 bg-white"
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right
      }}
    >
      <View className="flex-1 px-4 justify-center">
        <View className="w-full self-center" style={{ maxWidth: 440 }}>
          <View className="items-center mb-6">
            <Image
              source={require("../../assets/sparqpluglogo.png")}
              style={{ width: "100%", height: 180 }}
              resizeMode="contain"
            />
          </View>

          <Card>
            <SectionHeader
              title={isSignup ? "Create account" : "Sign in"}
              subtitle={
                isSignup
                  ? "Create an account to continue"
                  : "Sign in to continue"
              }
            />

            <View className="mt-4 gap-3">
          {isSignup ? (
            <FloatingLabelInput
              label="Full name"
              value={name}
              onChangeText={setName}
              placeholder="Full name"
              autoCapitalize="words"
              returnKeyType="next"
            />
          ) : null}

          <FloatingLabelInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="next"
          />

          <View className="flex-row items-center gap-2">
            <View className="flex-1">
              <FloatingLabelInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                autoCapitalize="none"
                secureTextEntry={!showPassword}
                returnKeyType="done"
              />
            </View>
            <Pressable
              onPress={() => setShowPassword((v) => !v)}
              hitSlop={10}
              className="h-12 w-12 rounded-xl border border-gray-200 bg-white items-center justify-center"
            >
              <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} />
            </Pressable>
          </View>

          <Pressable
            onPress={handleSubmit}
            className="rounded-xl bg-white border border-gray-200 px-4 py-3 items-center"
            hitSlop={10}
          >
            <Text className="text-base font-semibold">
              {isLoading
                ? "Please wait…"
                : isSignup
                  ? "Create account"
                  : "Sign in"}
            </Text>
          </Pressable>

          {error ? (
            <Text className="text-sm opacity-70">{error}</Text>
          ) : null}

          <View className="flex-row items-center justify-center pt-1">
            <Text className="text-sm opacity-70">
              {isSignup ? "Already have an account? " : "New here? "}
            </Text>
            <Pressable
              onPress={() => setIsSignup((v) => !v)}
              hitSlop={10}
            >
              <Text className="text-sm font-semibold">
                {isSignup ? "Sign in" : "Sign up"}
              </Text>
            </Pressable>
          </View>
            </View>
          </Card>
        </View>
      </View>
    </View>
  );
}
