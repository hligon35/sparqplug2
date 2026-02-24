import React from "react";
import { View, Text } from "react-native";
import { Badge } from "./ui";

export default function CalendarItem() {
  return (
    <View className="mt-2 rounded-xl border border-gray-100 p-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-semibold">Details</Text>
        <Badge label="Scheduled" />
      </View>
      <Text className="text-sm opacity-70 mt-2">
        Placeholder details area for location, attendees, and notes.
      </Text>
    </View>
  );
}
