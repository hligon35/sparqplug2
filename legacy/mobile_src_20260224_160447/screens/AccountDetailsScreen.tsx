import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../../App";
import { endpoints } from "../services/endpoints";
import { Card, ListRow, Screen, SectionHeader } from "../components/ui";
import { ClientOnboardingModal } from "../components/ClientOnboardingModal";
import { useSession } from "../hooks/useSession";

type RouteParams = { accountId: number };

type ClientAccount = { id: number; name: string; status?: string };

type Business = {
  id: number;
  name: string;
  industry?: string;
  status?: string;
};

export default function AccountDetailsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { accountId } = (route.params as RouteParams) || { accountId: 0 };
  const { isAdmin } = useSession();

  const [account, setAccount] = useState<ClientAccount | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [addBusinessOpen, setAddBusinessOpen] = useState(false);

  async function refresh() {
    try {
      setStatus(null);
      const [accRes, bizRes] = await Promise.all([
        endpoints.clientAccounts.get(accountId),
        endpoints.clients.list({ account: accountId })
      ]);

      setAccount(accRes.data);
      setBusinesses(Array.isArray(bizRes.data) ? bizRes.data : bizRes.data?.results ?? []);
    } catch (e: any) {
      setStatus(e?.message ?? "Unable to load businesses");
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId]);

  return (
    <Screen>
      <SectionHeader
        title={account?.name ?? "Client"}
        subtitle={status ?? (account?.status || "Businesses")}
        action={
          isAdmin ? (
            <View className="h-10 w-10 rounded-full border border-gray-200 bg-white items-center justify-center">
              <Ionicons name="add" size={22} color="#111827" />
            </View>
          ) : undefined
        }
        onPressAction={isAdmin ? () => setAddBusinessOpen(true) : undefined}
      />

      <Card>
        <View className="p-4">
          {businesses.length ? (
            <View>
              {businesses.map((item, idx) => (
                <View key={String(item.id)}>
                  {idx ? <View className="h-3" /> : null}
                  <ListRow
                    title={item.name}
                    subtitle={`${item.industry ?? "Industry TBD"} • ${item.status ?? "status"}`}
                    right={<Ionicons name="chevron-forward" size={20} color="#111827" />}
                    onPress={() => navigation.navigate("ClientDetails", { clientId: item.id })}
                  />
                </View>
              ))}
            </View>
          ) : (
            <View className="py-8">
              <Text className="opacity-70">No businesses yet.</Text>
            </View>
          )}
        </View>
      </Card>

      {isAdmin ? (
        <ClientOnboardingModal
          visible={addBusinessOpen}
          onClose={() => setAddBusinessOpen(false)}
          defaultAccountId={accountId}
          onCreated={async () => {
            await refresh();
          }}
        />
      ) : null}
    </Screen>
  );
}
