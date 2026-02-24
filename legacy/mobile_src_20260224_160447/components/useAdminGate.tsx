import React from "react";
import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { useSession } from "../hooks/useSession";
import { Badge, Card, Screen } from "./ui";

type AdminGate = {
  enabled: boolean;
  guard: React.ReactElement | null;
};

export function useAdminGate(subtitle: string): AdminGate {
  const { isAdmin, loading } = useSession();
  const navigation = useNavigation<any>();

  const guard = React.useMemo(() => {
    if (loading) {
      return (
        <Screen subtitle={subtitle} statusText="Loading session…">
          <View />
        </Screen>
      );
    }

    if (isAdmin) return null;

    return (
      <Screen subtitle={subtitle} statusText="Admin-only area">
        <Card title="Access restricted">
          <View className="mt-2">
            <Text className="text-sm opacity-70">
              This section is available to admins only.
            </Text>

            <View className="flex-row justify-end mt-4">
              <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
                <Badge label="Back" />
              </Pressable>
            </View>
          </View>
        </Card>
      </Screen>
    );
  }, [isAdmin, loading, navigation, subtitle]);

  return { enabled: isAdmin && !loading, guard };
}
