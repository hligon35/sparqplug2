import AsyncStorage from "@react-native-async-storage/async-storage";

import { normalizePriority, type TaskPriority } from "./taskPriority";

export type OfflineTaskRecord = {
  local_id: number;
  server_id: number | null;
  title: string;
  status: string;
  priority: TaskPriority;
  created_at: string;
  pending: "none" | "create" | "update" | "delete";
};

const KEY = "sparqplug.offline.tasks.v1";

async function readAll(): Promise<OfflineTaskRecord[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((t: any) => {
        const local_id = Number(t.local_id);
        const server_id = t.server_id == null ? null : Number(t.server_id);
        const title = String(t.title ?? "");
        const status = String(t.status ?? "todo");
        const priority = normalizePriority(t.priority);
        const created_at = String(t.created_at ?? "");
        const pendingRaw = String(t.pending ?? "none");
        const pending: OfflineTaskRecord["pending"] =
          pendingRaw === "create" || pendingRaw === "update" || pendingRaw === "delete" ? pendingRaw : "none";
        return {
          local_id,
          server_id: server_id != null && Number.isFinite(server_id) ? server_id : null,
          title,
          status,
          priority,
          created_at,
          pending
        } as OfflineTaskRecord;
      })
      .filter((t: OfflineTaskRecord) => Number.isFinite(t.local_id) && !!t.title);
  } catch {
    return [];
  }
}

async function writeAll(list: OfflineTaskRecord[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

function sortNewestFirst(list: OfflineTaskRecord[]): OfflineTaskRecord[] {
  return list.slice().sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
}

export async function listOfflineTasks(): Promise<OfflineTaskRecord[]> {
  return sortNewestFirst(await readAll());
}

export async function cacheServerTasks(params: {
  tasks: Array<{ id: number; title: string; status?: string; priority?: TaskPriority; created_at?: string }>;
}): Promise<OfflineTaskRecord[]> {
  const existing = await readAll();
  const keepLocal = existing.filter((t) => t.server_id == null || t.pending === "create");

  const cachedServer: OfflineTaskRecord[] = params.tasks
    .map((t) => {
      const id = Number(t.id);
      return {
        local_id: id,
        server_id: id,
        title: String(t.title ?? "Untitled"),
        status: String(t.status ?? "todo"),
        priority: normalizePriority(t.priority),
        created_at: String(t.created_at ?? ""),
        pending: "none" as const
      };
    })
    .filter((t) => Number.isFinite(t.local_id) && !!t.title);

  const merged = [...keepLocal, ...cachedServer];
  await writeAll(merged);
  return sortNewestFirst(merged);
}

export async function addOfflineTask(params: {
  title: string;
  priority: TaskPriority;
}): Promise<OfflineTaskRecord[]> {
  const list = await readAll();
  const next: OfflineTaskRecord = {
    local_id: Date.now(),
    server_id: null,
    title: params.title.trim() || "Untitled",
    status: "todo",
    priority: normalizePriority(params.priority),
    created_at: new Date().toISOString(),
    pending: "create"
  };
  const updated = [next, ...list];
  await writeAll(updated);
  return sortNewestFirst(updated);
}

export async function setOfflineTaskStatus(params: {
  local_id: number;
  status: string;
}): Promise<OfflineTaskRecord[]> {
  const list = await readAll();
  const updated = list.map((t) => {
    if (t.local_id !== params.local_id) return t;
    const nextStatus = String(params.status ?? "todo");

    if (t.pending === "create") {
      return { ...t, status: nextStatus };
    }

    if (t.pending === "none") {
      return {
        ...t,
        status: nextStatus,
        pending: t.server_id != null ? ("update" as const) : ("none" as const)
      };
    }

    if (t.pending === "update") {
      return { ...t, status: nextStatus };
    }

    return t;
  });

  await writeAll(updated);
  return sortNewestFirst(updated);
}

export async function removeOfflineTask(params: { local_id: number }): Promise<OfflineTaskRecord[]> {
  const list = await readAll();

  const target = list.find((t) => t.local_id === params.local_id);
  if (!target) return sortNewestFirst(list);

  // Local-only tasks can be dropped immediately.
  if (target.pending === "create" || target.server_id == null) {
    const filtered = list.filter((t) => t.local_id !== params.local_id);
    await writeAll(filtered);
    return sortNewestFirst(filtered);
  }

  // Server-backed cached task: mark for deletion.
  const updated = list.map((t) => (t.local_id === params.local_id ? { ...t, pending: "delete" as const } : t));
  await writeAll(updated);
  return sortNewestFirst(updated);
}

export async function clearCompletedOfflineTasks(): Promise<OfflineTaskRecord[]> {
  const list = await readAll();
  const isDone = (status: unknown) => {
    const s = String(status ?? "").toLowerCase().trim();
    return s === "done" || s === "completed";
  };

  const next: OfflineTaskRecord[] = [];
  for (const t of list) {
    if (!isDone(t.status)) {
      next.push(t);
      continue;
    }

    if (t.pending === "create" || t.server_id == null) {
      continue;
    }

    next.push({ ...t, pending: "delete" });
  }

  await writeAll(next);
  return sortNewestFirst(next);
}

export async function popPendingForSync(): Promise<OfflineTaskRecord[]> {
  const list = await readAll();
  return list.filter((t) => t.pending !== "none");
}

export async function markSynced(params: { local_id: number }): Promise<OfflineTaskRecord[]> {
  const list = await readAll();
  const updated = list.map((t) => (t.local_id === params.local_id ? { ...t, pending: "none" as const } : t));
  await writeAll(updated);
  return sortNewestFirst(updated);
}

export async function deleteLocalRecord(params: { local_id: number }): Promise<OfflineTaskRecord[]> {
  const list = await readAll();
  const filtered = list.filter((t) => t.local_id !== params.local_id);
  await writeAll(filtered);
  return sortNewestFirst(filtered);
}
