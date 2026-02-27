import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Screen } from '../components/ui/Screen';
import { Card } from '../components/ui/Card';

function HeaderIconButton({ icon, onPress }: { icon: any; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="w-12 h-12 items-center justify-center rounded-full bg-white border border-gray-200"
    >
      <Ionicons name={icon} size={22} color="black" />
    </Pressable>
  );
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <View className="flex-1 rounded-2xl border border-gray-200 bg-white px-3 py-4 items-center justify-center">
      <Text className="text-sm opacity-70 font-semibold">{label}</Text>
      <Text className="text-[26px] font-bold text-gray-900 mt-1">{value}</Text>
    </View>
  );
}

export function DashboardScreen({ navigation }: any) {
  return (
    <Screen
      title="Dashboard"
      headerLeft={<HeaderIconButton icon="checkbox-outline" onPress={() => navigation.navigate('Tasks')} />}
      headerRight={<HeaderIconButton icon="person-outline" onPress={() => navigation.navigate('Profile')} />}
    >
      <Card className="p-5">
        <Text className="text-lg font-bold text-gray-900">Clients</Text>
        <View className="flex-row gap-3 mt-4">
          <StatTile label="Total" value={4} />
          <StatTile label="Active" value={2} />
          <StatTile label="Prospect" value={0} />
        </View>
      </Card>

      <Card className="p-5">
        <Text className="text-lg font-bold text-gray-900">Financials</Text>
        <View className="gap-3 mt-4">
          <View className="flex-row gap-3">
            <StatTile label="Domain" value="$24.00/yr" />
            <StatTile label="Email" value="$42.30/mo" />
          </View>
          <View className="flex-row gap-3">
            <StatTile label="Overhead (est.)" value="$44.30/mo" />
            <StatTile label="Income" value="$250.00/mo" />
          </View>
          <View className="flex-row">
            <View className="flex-1">
              <StatTile label="Net (est.)" value="$205.70/mo" />
            </View>
          </View>
        </View>
      </Card>

      <Card className="p-5">
        <Text className="text-lg font-bold text-gray-900">Tasks</Text>
        <View className="flex-row gap-3 mt-4">
          <StatTile label="Open" value={3} />
          <StatTile label="Total" value={3} />
          <StatTile label="Completed" value={0} />
          <StatTile label="Assigned" value={0} />
        </View>
      </Card>

      <Card className="p-5">
        <Text className="text-lg font-bold text-gray-900">Analytics</Text>

        <View className="gap-3 mt-4">
          <View className="flex-row gap-3">
            <StatTile label="Visitors (30d)" value={0} />
            <StatTile label="Pageviews (30d)" value={0} />
          </View>
          <View className="flex-row gap-3">
            <StatTile label="Impressions (30d)" value={0} />
            <StatTile label="Followers" value={0} />
          </View>
          <View className="flex-row">
            <View className="flex-1 rounded-2xl border border-gray-200 bg-white px-3 py-4 items-center justify-center">
              <Text className="text-sm opacity-70 font-semibold">Engagement rate (avg 30d)</Text>
              <Text className="text-[26px] font-bold text-gray-900 mt-1">Not set</Text>
            </View>
          </View>
        </View>
      </Card>

      <Card className="p-5">
        <Text className="text-lg font-bold text-gray-900">Business Analytics</Text>
        <View className="gap-3 mt-4">
          <View className="flex-row gap-3">
            <StatTile label="Calendar" value={0} />
            <StatTile label="Notes" value={0} />
          </View>
          <View className="flex-row gap-3">
            <StatTile label="Notifications" value={1} />
            <StatTile label="Unread" value={1} />
          </View>
        </View>
      </Card>
    </Screen>
  );
}
