import AsyncStorage from "@react-native-async-storage/async-storage";

import { endpoints } from "./endpoints";
export type LocalNotification = {
  id: number;
  type: string;
  message: string;
  is_read?: boolean;
  created_at?: string;
};

const KEY = "sparqplug.notifications.v1";

async function readAll(): Promise<LocalNotification[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(list: LocalNotification[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

export async function listLocalNotifications(): Promise<LocalNotification[]> {
  const list = await readAll();
  return list.slice().sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
}

export async function addTeamNotification(message: string): Promise<LocalNotification> {
  const list = await readAll();
  const item: LocalNotification = {
    id: Date.now(),
    type: "team",
    message,
    is_read: false,
    created_at: new Date().toISOString()
  };
  await writeAll([item, ...list]);

  // Best-effort server sync (no-op if unauthenticated).
  try {
    await endpoints.notifications.create({ type: item.type, message: item.message });
  } catch {
    // ignore
  }

  return item;
}

export async function clearLocalNotifications(): Promise<void> {
  await writeAll([]);
}
