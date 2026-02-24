import React, { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../../App";
import { endpoints } from "../services/endpoints";
import { listWithFallback } from "../services/safeApi";
import { mockClientAccounts } from "../services/mockData";
import { Card, ListRow, Screen, SectionHeader } from "../components/ui";
import { ClientOnboardingModal } from "../components/ClientOnboardingModal";
import { useSession } from "../hooks/useSession";

type ClientAccount = {
  id: number;
  name: string;
  status?: string;
};

export default function AccountsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isAdmin } = useSession();

  const [accounts, setAccounts] = useState<ClientAccount[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const subtitle = useMemo(() => {
    if (status) return status;
    return "Accounts";
  }, [status]);

  async function refresh() {
    setStatus(null);
    const res = await listWithFallback<ClientAccount>(endpoints.clientAccounts.list, mockClientAccounts);
    setAccounts(res.data);
    if (res.error) setStatus(res.error);
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await listWithFallback<ClientAccount>(endpoints.clientAccounts.list, mockClientAccounts);
        if (!active) return;
        setAccounts(res.data);
        if (res.error) setStatus(res.error);
      } catch (e: any) {
        if (!active) return;
        setAccounts(mockClientAccounts);
        setStatus(e?.message ?? "Unable to load accounts");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <Screen>
      <SectionHeader
        title="Clients"
        subtitle={subtitle}
        action={
          isAdmin ? (
            <View className="h-10 w-10 rounded-full border border-gray-200 bg-white items-center justify-center">
              <Ionicons name="add" size={22} color="#111827" />
            </View>
          ) : undefined
        }
        onPressAction={isAdmin ? () => setCreateOpen(true) : undefined}
      />

      <Card>
        <View className="p-4">
          {accounts.length ? (
            <View>
              {accounts.map((item, idx) => (
                <View key={String(item.id)}>
                  {idx ? <View className="h-3" /> : null}
                  <ListRow
                    title={item.name}
                    subtitle={item.status ? item.status : "Client"}
                    right={<Ionicons name="chevron-forward" size={20} color="#111827" />}
                    onPress={() => navigation.navigate("AccountDetails", { accountId: item.id })}
                  />
                </View>
              ))}
            </View>
          ) : (
            <View className="py-8">
              <Text className="opacity-70">No clients yet.</Text>
            </View>
          )}
        </View>
      </Card>

      {isAdmin ? (
        <ClientOnboardingModal
          visible={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={async ({ accountId }) => {
            await refresh();
            if (accountId) navigation.navigate("AccountDetails", { accountId });
          }}
        />
      ) : null}
    </Screen>
  );
}
