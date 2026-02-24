import AsyncStorage from "@react-native-async-storage/async-storage";

import { mockTasks } from "./mockData";
import { normalizePriority, type TaskPriority } from "./taskPriority";

export type StoredTask = {
  id: number;
  title: string;
  status: string;
  priority: TaskPriority;
  created_at: string;
  assigneeId?: number;
  assigneeName?: string;
  assignedById?: number;
  assignedByName?: string;
};

const KEY = "sparqplug.tasks.items.v1";

async function readAll(): Promise<StoredTask[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((t: any) => ({
        id: Number(t.id),
        title: String(t.title ?? ""),
        status: String(t.status ?? "todo"),
        priority: normalizePriority(t.priority),
        created_at: String(t.created_at ?? ""),
        assigneeId: t.assigneeId != null ? Number(t.assigneeId) : undefined,
        assigneeName: t.assigneeName != null ? String(t.assigneeName) : undefined,
        assignedById: t.assignedById != null ? Number(t.assignedById) : undefined,
        assignedByName: t.assignedByName != null ? String(t.assignedByName) : undefined
      }))
      .filter((t: StoredTask) => Number.isFinite(t.id) && !!t.title);
  } catch {
    return [];
  }
}

async function writeAll(list: StoredTask[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

async function ensureSeeded(list: StoredTask[]): Promise<StoredTask[]> {
  if (list.length) return list;

  const seeded: StoredTask[] = (mockTasks as any[]).map((t) => ({
    id: Number(t.id),
    title: String(t.title ?? "Untitled"),
    status: String(t.status ?? "todo"),
    priority: normalizePriority(t.priority),
    created_at: new Date().toISOString()
  }));

  await writeAll(seeded);
  return seeded;
}

export async function listTasks(): Promise<StoredTask[]> {
  const list = await readAll();
  const seeded = await ensureSeeded(list);
  return seeded.slice().sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
}

export async function addTask(params: {
  title: string;
  priority: TaskPriority;
  assigneeId?: number;
  assigneeName?: string;
  assignedById?: number;
  assignedByName?: string;
}): Promise<StoredTask[]> {
  const list = await listTasks();
  const next: StoredTask = {
    id: Date.now(),
    title: params.title.trim() || "Untitled",
    status: "todo",
    priority: params.priority,
    created_at: new Date().toISOString(),
    assigneeId: params.assigneeId,
    assigneeName: params.assigneeName,
    assignedById: params.assignedById,
    assignedByName: params.assignedByName
  };
  const updated = [next, ...list];
  await writeAll(updated);
  return updated;
}
