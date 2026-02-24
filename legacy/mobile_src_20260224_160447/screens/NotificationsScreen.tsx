import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { endpoints } from "../services/endpoints";
import { listWithFallback } from "../services/safeApi";
import { mockNotifications } from "../services/mockData";
import { listLocalNotifications } from "../services/notificationsStore";
import { Badge, Card, ListRow, Screen, SectionHeader } from "../components/ui";

type Notification = {
  id: number;
  type: string;
  message: string;
  is_read?: boolean;
  created_at?: string;
};

export default function NotificationsScreen() {
  const [items, setItems] = useState<Notification[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setStatus(null);
        const [res, local] = await Promise.all([
          listWithFallback<Notification>(
            endpoints.notifications.list,
            mockNotifications as any
          ),
          listLocalNotifications()
        ]);
        if (!active) return;

        const merged = [...(local as any), ...(res.data as any)].sort((a, b) =>
          String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""))
        );

        setItems(merged);
        if (res.error) setStatus(res.error);
      } catch (e: any) {
        if (!active) return;
        const local = await listLocalNotifications();
        setItems([...(local as any), ...(mockNotifications as any)]);
        setStatus(e?.message ?? "Unable to load notifications");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const unreadCount = items.filter((n) => !n.is_read).length;

  return (
    <Screen
      subtitle={`${unreadCount} unread`}
      statusText={status}
    >
      <Card>
        <SectionHeader title="Inbox" />
        <View className="mt-3">
          {items.length ? (
            <View>
              {items.map((item, idx) => (
                <View key={String(item.id)}>
                  {idx ? <View className="h-3" /> : null}
                  <ListRow
                    title={item.type}
                    subtitle={item.message}
                    right={<Badge label={item.is_read ? "Read" : "Unread"} />}
                  />
                </View>
              ))}
            </View>
          ) : (
            <View className="py-8">
              <Text className="opacity-70">No notifications yet.</Text>
            </View>
          )}
        </View>
      </Card>
    </Screen>
  );
}
