import React from "react";
import { Alert, Pressable, View, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../../App";
import { Card, ListRow, Screen } from "../components/ui";
import { Ionicons } from "@expo/vector-icons";
import { setAuthToken } from "../services/api";
import { useSession } from "../hooks/useSession";
import { sessionStore } from "../services/sessionStore";

type Nav = NativeStackNavigationProp<RootStackParamList>;

function getInitials(name: string): string {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = (parts.length > 1 ? parts[parts.length - 1] : "")?.[0] ?? "";
  const initials = `${first}${last}`.toUpperCase();
  return initials || "?";
}

export default function AccountScreen() {
  const navigation = useNavigation<Nav>();
  const { user, isAdmin } = useSession();

  const displayName = user?.name ?? user?.username ?? "Account";
  const roleLabel = user?.role ? String(user.role) : isAdmin ? "Admin" : "User";

  function onLogout() {
    Alert.alert("Log out?", "You can sign in again anytime.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: () => {
          setAuthToken(null);
          sessionStore.clear();
          if (__DEV__) navigation.navigate("DevLogin");
          else navigation.goBack();
        }
      }
    ]);
  }

  return (
    <Screen>
      <View className="rounded-3xl border border-gray-200 bg-white/90 p-5">
        <View className="flex-row items-center">
          <Pressable onPress={() => navigation.navigate("Profile")} hitSlop={10} className="flex-row items-center flex-1 pr-3">
            <View className="h-14 w-14 rounded-full bg-gray-100 border border-gray-200 items-center justify-center">
              <Text className="text-lg font-semibold opacity-80">{getInitials(displayName)}</Text>
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-lg font-semibold">{displayName}</Text>
              <Text className="text-sm opacity-70 mt-1">{roleLabel} • View profile</Text>
            </View>
          </Pressable>

          <Pressable onPress={onLogout} hitSlop={10} className="rounded-full border border-gray-200 bg-white px-4 py-2">
            <Text className="text-sm font-semibold">Log out</Text>
          </Pressable>
        </View>
      </View>

      {isAdmin ? (
        <Card title="Company">
          <View className="mt-2">
            <ListRow
              title="Overhead expenses"
              subtitle="Email accounts, domains, software tools"
              right={<Ionicons name="chevron-forward" size={20} color="#111827" />}
              onPress={() => navigation.navigate("CompanyOverhead")}
            />
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}
