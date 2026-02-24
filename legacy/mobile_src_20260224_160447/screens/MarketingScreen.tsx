import React, { useEffect, useState } from "react";
import { ScrollView, View, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import type { RootStackParamList } from "../../App";
import { endpoints } from "../services/endpoints";
import { listWithFallback } from "../services/safeApi";
import { mockClients } from "../services/mockData";
import { Card, ListRow, Screen, SectionHeader, ServicePill } from "../components/ui";
import { getEnabledMarketingModules } from "../utils/marketingModules";

type Client = {
  id: number;
  name: string;
  industry?: string;
  status?: string;
  stage?: string;
  service?: string;
  monthlyCost?: number;
};

type ClientServiceRecord = {
  id: number;
  client: number;
  service_name: string;
  start_date?: string | null;
  end_date?: string | null;
};

function isActiveService(svc: ClientServiceRecord): boolean {
  const end = (svc.end_date ?? "").toString().trim();
  if (!end) return true;
  const t = Date.parse(end);
  if (!Number.isFinite(t)) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return t >= today.getTime();
}

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function MarketingScreen() {
  const navigation = useNavigation<Nav>();

  const [clients, setClients] = useState<Client[]>([]);
  const [servicesByClient, setServicesByClient] = useState<Record<number, string[]>>({});
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setStatus(null);
        const res = await listWithFallback<Client>(endpoints.clients.list, mockClients);
        if (!active) return;
        const loadedClients = res.data;

        // Load authoritative registered services (ClientService records). If this fails, fall back to client.service.
        let services: ClientServiceRecord[] = [];
        try {
          const svcRes = await endpoints.clientServices.list();
          services = (svcRes.data ?? []) as ClientServiceRecord[];
        } catch {
          services = [];
        }

        const byClient = new Map<number, string[]>();
        for (const s of services.filter(isActiveService)) {
          const cid = Number((s as any).client);
          const name = String((s as any).service_name ?? "").trim();
          if (!Number.isFinite(cid) || !name) continue;
          const prev = byClient.get(cid) ?? [];
          prev.push(name);
          byClient.set(cid, prev);
        }

        const byClientObj: Record<number, string[]> = {};
        byClient.forEach((v, k) => {
          byClientObj[k] = v;
        });
        setServicesByClient(byClientObj);

        // Only show clients with enabled marketing modules.
        const filtered = loadedClients.filter((c) => {
          const registered = byClient.get(Number(c.id)) ?? [];
          const serviceRaw = registered.length ? registered.join(", ") : String(c.service ?? "");
          return getEnabledMarketingModules(serviceRaw).length > 0;
        });

        setClients(filtered);
        if (res.error) setStatus(res.error);
      } catch (e: any) {
        if (!active) return;
        setClients(mockClients);
        setStatus(e?.message ?? "Unable to load marketing clients");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <Screen subtitle="Pick a client to manage their Marketing Engine." statusText={status}>
      <Card>
        <SectionHeader title="Marketing Engine" subtitle="Only shows modules clients are signed up for." />
        <View className="mt-3">
          {clients.length === 0 ? (
            <View className="py-8">
              <Text className="opacity-70">No clients have marketing modules enabled yet.</Text>
            </View>
          ) : (
            clients
              .map((c) => {
                const registered = servicesByClient[Number(c.id)] ?? [];
                const serviceRaw = registered.length ? registered.join(", ") : String(c.service ?? "");
                const enabledModules = getEnabledMarketingModules(serviceRaw);
              return (
                <View key={c.id} className="border-b border-gray-100">
                <ListRow
                  title={c.name}
                  subtitle={`${c.industry ?? "Industry TBD"} • ${c.status ?? "status"}`}
                  right={<Ionicons name="chevron-forward" size={20} color="#111827" />}
                  onPress={() => navigation.navigate("ClientDetails", { clientId: Number(c.id) })}
                />

                <View className="pb-3">
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row gap-2 pr-2">
                      {enabledModules.map((m) => (
                        <ServicePill
                          key={m.key}
                          label={m.label}
                          onPress={() => navigation.navigate(m.route as any, { clientId: Number(c.id) } as any)}
                        />
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </View>
              );
            })
          )}
        </View>
      </Card>
    </Screen>
  );
}
