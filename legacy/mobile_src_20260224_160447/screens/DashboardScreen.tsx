import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { endpoints } from "../services/endpoints";
import { listWithFallback } from "../services/safeApi";
import {
  mockCalendarItems,
  mockClients,
  mockTasks,
  mockNotes,
  mockNotifications
} from "../services/mockData";
import { Badge, Card, ListRow, Screen, SectionHeader } from "../components/ui";
import type { RootStackParamList } from "../../App";
import { ClientOnboardingModal } from "../components/ClientOnboardingModal";
import { useSession } from "../hooks/useSession";
import { useMockMode } from "../hooks/useMockMode";
import { getUpcomingMeetWithinMinutes } from "../utils/meet";

export default function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isAdmin } = useSession();
  const mockMode = useMockMode();

  const [counts, setCounts] = useState({
    clients: 0,
    clients_active: 0,
    clients_prospect: 0,

    calendar: 0,
    tasks: 0,
    tasks_open: 0,
    tasks_completed: 0,
    tasks_assigned: 0,

    notes: 0,
    notifications: 0,
    notifications_unread: 0
  });
  const [status, setStatus] = useState<string | null>(null);
  const [createClientOpen, setCreateClientOpen] = useState(false);
  const [calendarItems, setCalendarItems] = useState<any[]>([]);
  const [nowTick, setNowTick] = useState(() => Date.now());

  const financials = useMemo(
    () => ({
      domain_yearly: "$24.00/yr",
      email_monthly: "$42.30/mo",
      overhead_monthly: "$44.30/mo",
      income_monthly: "$250.00/mo",
      net_monthly: "$205.70/mo"
    }),
    []
  );

  const analytics = useMemo(
    () => ({
      visitors_30d: 0,
      pageviews_30d: 0,
      impressions_30d: 0,
      followers: 0,
      engagement_rate_30d: "Not set"
    }),
    []
  );

  async function refreshCounts(activeRef?: { active: boolean }) {
    try {
      setStatus(null);

      const [clients, calendar, tasks, notes, notifications] = await Promise.all([
        listWithFallback(endpoints.clients.list, mockClients),
        listWithFallback(endpoints.calendar.list, mockCalendarItems),
        listWithFallback(endpoints.tasks.list, mockTasks),
        listWithFallback(endpoints.notes.list, mockNotes as any),
        listWithFallback(endpoints.notifications.list, mockNotifications as any)
      ]);

      const firstError =
        clients.error ||
        calendar.error ||
        tasks.error ||
        notes.error ||
        notifications.error ||
        null;

      if (activeRef && !activeRef.active) return;

      const clientsData: any[] = clients.data ?? [];
      const tasksData: any[] = tasks.data ?? [];
      const notesData: any[] = notes.data ?? [];
      const calendarData: any[] = calendar.data ?? [];
      const notificationsData: any[] = notifications.data ?? [];

      setCalendarItems(calendarData);

      const clientsActive = clientsData.filter((c) => String(c?.status ?? "").toLowerCase() === "active").length;
      const clientsProspect = clientsData.filter((c) => String(c?.status ?? "").toLowerCase() === "prospect").length;

      const tasksCompleted = tasksData.filter((t) => {
        const s = String(t?.status ?? "").toLowerCase();
        return s === "done" || s === "completed";
      }).length;
      const tasksOpen = Math.max(0, tasksData.length - tasksCompleted);
      const tasksAssigned = tasksData.filter((t) => Boolean(t?.assigned_to ?? t?.assignee ?? t?.assignedTo)).length;

      const notificationsUnread = notificationsData.filter((n) => n?.is_read === false).length;

      setCounts({
        clients: clientsData.length,
        clients_active: clientsActive,
        clients_prospect: clientsProspect,

        calendar: calendarData.length,
        tasks: tasksData.length,
        tasks_open: tasksOpen,
        tasks_completed: tasksCompleted,
        tasks_assigned: tasksAssigned,

        notes: notesData.length,
        notifications: notificationsData.length,
        notifications_unread: notificationsUnread
      });

      if (firstError) setStatus(firstError);
    } catch (e: any) {
      if (activeRef && !activeRef.active) return;
      setStatus(e?.message ?? "Unable to load dashboard");

      const clientsData: any[] = mockClients as any;
      const tasksData: any[] = mockTasks as any;
      const notesData: any[] = mockNotes as any;
      const calendarData: any[] = mockCalendarItems as any;
      const notificationsData: any[] = mockNotifications as any;

      setCalendarItems(calendarData);

      const clientsActive = clientsData.filter((c) => String(c?.status ?? "").toLowerCase() === "active").length;
      const clientsProspect = clientsData.filter((c) => String(c?.status ?? "").toLowerCase() === "prospect").length;

      const tasksCompleted = tasksData.filter((t) => {
        const s = String(t?.status ?? "").toLowerCase();
        return s === "done" || s === "completed";
      }).length;
      const tasksOpen = Math.max(0, tasksData.length - tasksCompleted);
      const tasksAssigned = tasksData.filter((t) => Boolean(t?.assigned_to ?? t?.assignee ?? t?.assignedTo)).length;

      const notificationsUnread = notificationsData.filter((n) => n?.is_read === false).length;

      setCounts({
        clients: clientsData.length,
        clients_active: clientsActive,
        clients_prospect: clientsProspect,

        calendar: calendarData.length,
        tasks: tasksData.length,
        tasks_open: tasksOpen,
        tasks_completed: tasksCompleted,
        tasks_assigned: tasksAssigned,

        notes: notesData.length,
        notifications: notificationsData.length,
        notifications_unread: notificationsUnread
      });
    }
  }

  useEffect(() => {
    const activeRef = { active: true };
    refreshCounts(activeRef);
    return () => {
      activeRef.active = false;
    };
  }, [mockMode.enabled]);

  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const upcomingMeet = useMemo(() => {
    return getUpcomingMeetWithinMinutes(calendarItems, nowTick, 15);
  }, [calendarItems, nowTick]);

  return (
    <Screen subtitle="" statusText={null}>

      {upcomingMeet ? (
        <Pressable
          onPress={async () => {
            try {
              await Linking.openURL(upcomingMeet.url);
            } catch {
              // ignore
            }
          }}
          className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3"
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-sm font-semibold text-indigo-900">Google Meet starting soon</Text>
              <Text className="text-xs text-indigo-900/80 mt-1" numberOfLines={2}>
                {(upcomingMeet.item?.title ? String(upcomingMeet.item.title) : "Meeting") +
                  ` • in ${upcomingMeet.minutes} min`}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="videocam" size={18} color="#4F46E5" />
              <Text className="text-sm font-semibold text-indigo-900 ml-2">Join</Text>
            </View>
          </View>
        </Pressable>
      ) : null}

      <Card>
        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-bold">Clients</Text>
          {isAdmin ? (
            <Pressable onPress={() => setCreateClientOpen(true)} hitSlop={10}>
              <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
                <Ionicons name="add" size={22} color="#111827" />
              </View>
            </Pressable>
          ) : null}
        </View>
        <View className="mt-4 flex-row justify-between">
          <View className="w-[31%] rounded-2xl border border-gray-200 bg-white px-3 py-4 items-center">
            <Text className="text-sm font-semibold opacity-70">Total</Text>
            <Text className="text-2xl font-semibold mt-2">{counts.clients}</Text>
          </View>
          <View className="w-[31%] rounded-2xl border border-gray-200 bg-white px-3 py-4 items-center">
            <Text className="text-sm font-semibold opacity-70">Active</Text>
            <Text className="text-2xl font-semibold mt-2">{counts.clients_active}</Text>
          </View>
          <View className="w-[31%] rounded-2xl border border-gray-200 bg-white px-3 py-4 items-center">
            <Text className="text-sm font-semibold opacity-70">Prospect</Text>
            <Text className="text-2xl font-semibold mt-2">{counts.clients_prospect}</Text>
          </View>
        </View>
      </Card>

      <Card>
        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-bold">Financials</Text>
          {isAdmin ? (
            <Pressable onPress={() => navigation.navigate("CompanyOverhead", { openAdd: true })} hitSlop={10}>
              <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
                <Ionicons name="add" size={22} color="#111827" />
              </View>
            </Pressable>
          ) : null}
        </View>
        <View className="mt-4 flex-row flex-wrap justify-between">
          <View className="w-[48%] rounded-2xl border border-gray-200 bg-white px-3 py-6 items-center mb-3">
            <Text className="text-sm font-semibold opacity-70">Domain</Text>
            <Text className="text-2xl font-semibold mt-2">{financials.domain_yearly}</Text>
          </View>
          <View className="w-[48%] rounded-2xl border border-gray-200 bg-white px-3 py-6 items-center mb-3">
            <Text className="text-sm font-semibold opacity-70">Email</Text>
            <Text className="text-2xl font-semibold mt-2">{financials.email_monthly}</Text>
          </View>
          <View className="w-[48%] rounded-2xl border border-gray-200 bg-white px-3 py-6 items-center mb-3">
            <Text className="text-sm font-semibold opacity-70">Overhead (est.)</Text>
            <Text className="text-2xl font-semibold mt-2">{financials.overhead_monthly}</Text>
          </View>
          <View className="w-[48%] rounded-2xl border border-gray-200 bg-white px-3 py-6 items-center mb-3">
            <Text className="text-sm font-semibold opacity-70">Income</Text>
            <Text className="text-2xl font-semibold mt-2">{financials.income_monthly}</Text>
          </View>

          <View className="w-full rounded-2xl border border-gray-200 bg-white px-3 py-6 items-center">
            <Text className="text-sm font-semibold opacity-70">Net (est.)</Text>
            <Text className="text-2xl font-semibold mt-2">{financials.net_monthly}</Text>
          </View>
        </View>
      </Card>

      <Card>
        <Text className="text-lg font-bold">Analytics</Text>
        <View className="mt-4 flex-row flex-wrap justify-between">
          <View className="w-[48%] rounded-2xl border border-gray-200 bg-white px-3 py-6 items-center mb-3">
            <Text className="text-sm font-semibold opacity-70">Visitors (30d)</Text>
            <Text className="text-2xl font-semibold mt-2">{analytics.visitors_30d}</Text>
          </View>
          <View className="w-[48%] rounded-2xl border border-gray-200 bg-white px-3 py-6 items-center mb-3">
            <Text className="text-sm font-semibold opacity-70">Pageviews (30d)</Text>
            <Text className="text-2xl font-semibold mt-2">{analytics.pageviews_30d}</Text>
          </View>
          <View className="w-[48%] rounded-2xl border border-gray-200 bg-white px-3 py-6 items-center mb-3">
            <Text className="text-sm font-semibold opacity-70">Impressions (30d)</Text>
            <Text className="text-2xl font-semibold mt-2">{analytics.impressions_30d}</Text>
          </View>
          <View className="w-[48%] rounded-2xl border border-gray-200 bg-white px-3 py-6 items-center mb-3">
            <Text className="text-sm font-semibold opacity-70">Followers</Text>
            <Text className="text-2xl font-semibold mt-2">{analytics.followers}</Text>
          </View>
          <View className="w-full rounded-2xl border border-gray-200 bg-white px-3 py-6 items-center">
            <Text className="text-sm font-semibold opacity-70">Engagement rate (avg 30d)</Text>
            <Text className="text-2xl font-semibold mt-2">{analytics.engagement_rate_30d}</Text>
          </View>
        </View>
      </Card>

      <Card>
        <Text className="text-lg font-bold">Business Analytics</Text>
        <View className="mt-4 flex-row flex-wrap justify-between">
          <View className="w-[48%] rounded-2xl border border-gray-200 bg-white px-3 py-6 items-center mb-3">
            <Text className="text-sm font-semibold opacity-70">Calendar</Text>
            <Text className="text-2xl font-semibold mt-2">{counts.calendar}</Text>
          </View>
          <View className="w-[48%] rounded-2xl border border-gray-200 bg-white px-3 py-6 items-center mb-3">
            <Text className="text-sm font-semibold opacity-70">Notes</Text>
            <Text className="text-2xl font-semibold mt-2">{counts.notes}</Text>
          </View>
          <View className="w-[48%] rounded-2xl border border-gray-200 bg-white px-3 py-6 items-center">
            <Text className="text-sm font-semibold opacity-70">Notifications</Text>
            <Text className="text-2xl font-semibold mt-2">{counts.notifications}</Text>
          </View>
          <View className="w-[48%] rounded-2xl border border-gray-200 bg-white px-3 py-6 items-center">
            <Text className="text-sm font-semibold opacity-70">Unread</Text>
            <Text className="text-2xl font-semibold mt-2">{counts.notifications_unread}</Text>
          </View>
        </View>
      </Card>

      <ClientOnboardingModal
        visible={createClientOpen}
        onClose={() => setCreateClientOpen(false)}
        onCreated={async () => {
          await refreshCounts();
        }}
      />
    </Screen>
  );
}
