import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Badge, Card, ListRow, Screen, SectionHeader } from "../components/ui";
import { listRemoteAgents, RemoteAgent } from "../services/monitoringService";

function formatLastSeen(value: string | null | undefined): string {
  if (!value) return "Never";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

function statusLabel(status: string): string {
  const s = String(status || "").toLowerCase();
  if (s === "ok") return "OK";
  if (s === "warn") return "Warning";
  if (s === "error") return "Error";
  return status || "Unknown";
}

export default function MonitoringDashboardScreen() {
  const [agents, setAgents] = React.useState<RemoteAgent[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [usingMock, setUsingMock] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = React.useState<Date | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await listRemoteAgents();
      const sorted = [...res.data].sort((a, b) => Number(b.is_online) - Number(a.is_online));
      setAgents(sorted);
      setUsingMock(res.usingMock);
      setError(res.error);
      setLastUpdatedAt(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
    const id = setInterval(() => {
      void refresh();
    }, 4000);
    return () => clearInterval(id);
  }, [refresh]);

  const onlineCount = agents.filter((a) => a.is_online).length;

  return (
    <Screen scroll>
      <Card>
        <SectionHeader
          title="Remote Monitoring"
          subtitle={
            usingMock
              ? "Mock data (set EXPO_PUBLIC_USE_MOCK=false + login)"
              : "Polling /api/monitoring/agents/"
          }
          action={
            <View className="flex-row items-center gap-2">
              {loading ? <Ionicons name="sync" size={18} /> : <Ionicons name="refresh" size={18} />}
            </View>
          }
          onPressAction={() => {
            if (!loading) void refresh();
          }}
          variant="card"
        />

        <View className="p-4 gap-3">
          <View className="flex-row items-center gap-2 flex-wrap">
            <Badge label={`${onlineCount}/${agents.length} online`} />
            {lastUpdatedAt ? <Badge label={`Updated ${lastUpdatedAt.toLocaleTimeString()}`} /> : null}
            {error ? <Badge label={`Error: ${error}`} /> : null}
          </View>

          <Text className="text-xs opacity-60">
            Tip: Use the backend endpoint POST /api/monitoring/heartbeat/ to report agent status.
          </Text>

          <View className="border-t border-gray-100" />

          {agents.length === 0 ? (
            <View className="py-6 items-center">
              <Text className="text-sm opacity-70">
                No agents yet. Send a heartbeat to get started.
              </Text>
            </View>
          ) : (
            <View>
              {agents.map((a) => (
                <ListRow
                  key={String(a.id)}
                  title={a.display_name || a.agent_id}
                  subtitle={`Status: ${statusLabel(a.status)} · Last seen: ${formatLastSeen(a.last_seen_at)}`}
                  right={<Badge label={a.is_online ? "Online" : "Offline"} />}
                />
              ))}
            </View>
          )}

          <Pressable
            className="rounded-xl border border-gray-200 bg-white px-4 py-3"
            onPress={() => void refresh()}
            disabled={loading}
          >
            <Text className="text-sm font-semibold">Refresh now</Text>
          </Pressable>
        </View>
      </Card>
    </Screen>
  );
}
