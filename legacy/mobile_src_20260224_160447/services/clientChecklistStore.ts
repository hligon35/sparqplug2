import AsyncStorage from "@react-native-async-storage/async-storage";

import { normalizePriority, type TaskPriority } from "./taskPriority";

export type ChecklistItem = {
  id: number;
  clientId: number;
  title: string;
  priority: TaskPriority;
  done: boolean;
  created_at: string;
};

function key(clientId: number) {
  return `sparqplug.client.${clientId}.checklist.v1`;
}

async function readAll(clientId: number): Promise<ChecklistItem[]> {
  const raw = await AsyncStorage.getItem(key(clientId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((i: any) => ({
        id: Number(i.id),
        clientId: Number(clientId),
        title: String(i.title ?? ""),
        priority: normalizePriority(i.priority),
        done: Boolean(i.done),
        created_at: String(i.created_at ?? "")
      }))
      .filter((i: ChecklistItem) => Number.isFinite(i.id) && !!i.title);
  } catch {
    return [];
  }
}

async function writeAll(clientId: number, list: ChecklistItem[]): Promise<void> {
  await AsyncStorage.setItem(key(clientId), JSON.stringify(list));
}

export async function listChecklist(clientId: number): Promise<ChecklistItem[]> {
  const list = await readAll(clientId);
  return list.slice().sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
}

export async function addChecklistItem(params: {
  clientId: number;
  title: string;
  priority: TaskPriority;
}): Promise<ChecklistItem[]> {
  const list = await listChecklist(params.clientId);
  const next: ChecklistItem = {
    id: Date.now(),
    clientId: params.clientId,
    title: params.title.trim() || "Untitled",
    priority: params.priority,
    done: false,
    created_at: new Date().toISOString()
  };
  const updated = [next, ...list];
  await writeAll(params.clientId, updated);
  return updated;
}

export async function toggleChecklistItem(params: {
  clientId: number;
  id: number;
  done: boolean;
}): Promise<ChecklistItem[]> {
  const list = await listChecklist(params.clientId);
  const updated = list.map((i) => (i.id === params.id ? { ...i, done: params.done } : i));
  await writeAll(params.clientId, updated);
  return updated;
}

export async function removeChecklistItem(params: { clientId: number; id: number }): Promise<ChecklistItem[]> {
  const list = await listChecklist(params.clientId);
  const updated = list.filter((i) => i.id !== params.id);
  await writeAll(params.clientId, updated);
  return updated;
}
