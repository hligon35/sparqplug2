import AsyncStorage from "@react-native-async-storage/async-storage";

import { addTeamNotification } from "./notificationsStore";
import { endpoints } from "./endpoints";
import { listTasks } from "./tasksDataStore";

const COMPLETED_KEY = "sparqplug.tasks.completedIds.v1";
const HIDDEN_KEY = "sparqplug.tasks.hiddenCompletedIds.v1";
const LAST_SEEN_KEY = "sparqplug.tasks.lastSeenIso.v1";

type TaskMeta = {
  completedIds: number[];
  hiddenCompletedIds: number[];
};

async function readNumberArray(key: string): Promise<number[]> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((v) => Number(v)).filter((n) => Number.isFinite(n)) : [];
  } catch {
    return [];
  }
}

async function writeNumberArray(key: string, values: number[]): Promise<void> {
  const unique = Array.from(new Set(values));
  await AsyncStorage.setItem(key, JSON.stringify(unique));
}

export async function getTaskMeta(): Promise<TaskMeta> {
  const [completedIds, hiddenCompletedIds] = await Promise.all([
    readNumberArray(COMPLETED_KEY),
    readNumberArray(HIDDEN_KEY)
  ]);

  return { completedIds, hiddenCompletedIds };
}

export async function toggleTaskComplete(params: {
  id: number;
  title: string;
  complete: boolean;
  assigneeId?: number;
  assigneeName?: string;
  assignedById?: number;
  assignedByName?: string;
}): Promise<TaskMeta> {
  const meta = await getTaskMeta();
  const completed = new Set(meta.completedIds);
  const hidden = new Set(meta.hiddenCompletedIds);

  if (params.complete) {
    completed.add(params.id);
    // If it was previously cleared/hidden, bring it back.
    hidden.delete(params.id);
    await addTeamNotification(`Task completed: ${params.title}`);

    // If someone else assigned this task, notify them.
    if (
      params.assignedById &&
      params.assigneeId &&
      Number(params.assignedById) !== Number(params.assigneeId)
    ) {
      try {
        await endpoints.notifications.send({
          user_id: Number(params.assignedById),
          type: "task",
          message: `${params.assigneeName || "A teammate"} completed: ${params.title}`
        });
      } catch {
        // Best-effort.
      }
    }
  } else {
    completed.delete(params.id);
  }

  const next = {
    completedIds: Array.from(completed),
    hiddenCompletedIds: Array.from(hidden)
  };

  await Promise.all([
    writeNumberArray(COMPLETED_KEY, next.completedIds),
    writeNumberArray(HIDDEN_KEY, next.hiddenCompletedIds)
  ]);

  return next;
}

export async function clearCompletedTasks(): Promise<TaskMeta> {
  const meta = await getTaskMeta();
  const completed = new Set(meta.completedIds);
  const hidden = new Set(meta.hiddenCompletedIds);

  for (const id of completed) hidden.add(id);

  const next = {
    completedIds: meta.completedIds,
    hiddenCompletedIds: Array.from(hidden)
  };

  await writeNumberArray(HIDDEN_KEY, next.hiddenCompletedIds);
  return next;
}

export async function getTasksLastSeenIso(): Promise<string | null> {
  const raw = await AsyncStorage.getItem(LAST_SEEN_KEY);
  return raw ? String(raw) : null;
}

export async function setTasksLastSeenNow(): Promise<void> {
  await AsyncStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
}

export async function getNewTasksCount(): Promise<number> {
  const [tasks, meta, lastSeen] = await Promise.all([
    listTasks(),
    getTaskMeta(),
    getTasksLastSeenIso()
  ]);

  const completed = new Set(meta.completedIds);
  const hidden = new Set(meta.hiddenCompletedIds);
  const lastSeenTime = lastSeen ? new Date(lastSeen).getTime() : 0;

  return tasks.filter((t) => {
    const id = Number((t as any).id);
    if (!Number.isFinite(id)) return false;
    if (hidden.has(id)) return false;
    if (completed.has(id)) return false;
    const createdAt = String((t as any).created_at ?? "");
    const createdTime = createdAt ? new Date(createdAt).getTime() : 0;
    return createdTime > lastSeenTime;
  }).length;
}
