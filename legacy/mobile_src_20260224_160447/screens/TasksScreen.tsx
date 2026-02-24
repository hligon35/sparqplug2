import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Badge, Card, FloatingLabelInput, ListRow, ModalSurface, Screen, SectionHeader, StackModal } from "../components/ui";
import { endpoints } from "../services/endpoints";
import {
  addOfflineTask,
  cacheServerTasks,
  clearCompletedOfflineTasks,
  deleteLocalRecord,
  listOfflineTasks,
  popPendingForSync,
  setOfflineTaskStatus
} from "../services/offlineTasksStore";
import { normalizePriority, priorityDotClass, priorityLabel, type TaskPriority } from "../services/taskPriority";
import { isProbablyOfflineError } from "../utils/offline";
import { useSession } from "../hooks/useSession";

type Task = {
  id: number;
  client?: number;
  assigned_to?: number | null;
  title: string;
  status?: string;
  priority?: TaskPriority;
  due_date?: string;
  created_at?: string;
};

type User = {
  id: number;
  name: string;
  email?: string;
  username?: string;
};

function isDoneStatus(status: unknown): boolean {
  const s = String(status ?? "").toLowerCase().trim();
  return s === "done" || s === "completed";
}

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const { isAdmin } = useSession();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [usingOffline, setUsingOffline] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<TaskPriority>("med");
  const [team, setTeam] = useState<User[]>([]);
  const [me, setMe] = useState<User | null>(null);
  const [assigneePickerOpen, setAssigneePickerOpen] = useState(false);
  const [assignTo, setAssignTo] = useState<User | null>(null);

  const canAdd = useMemo(() => newTitle.trim().length > 0, [newTitle]);

  function cacheSnapshot(list: Task[]) {
    void cacheServerTasks({
      tasks: list.map((t) => ({
        id: Number(t.id),
        title: String(t.title ?? "Untitled"),
        status: String(t.status ?? "todo"),
        priority: normalizePriority(t.priority),
        created_at: String(t.created_at ?? "")
      }))
    });
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setStatus(null);
        setUsingOffline(false);
        const res = await endpoints.tasks.list();
        const items = (res.data ?? []) as any[];

        const normalized: Task[] = items.map((t) => ({
          id: Number(t.id),
          client: t.client != null ? Number(t.client) : undefined,
          assigned_to: t.assigned_to ?? null,
          title: String(t.title ?? "Untitled"),
          status: String(t.status ?? "todo"),
          priority: normalizePriority(t.priority),
          due_date: t.due_date,
          created_at: String(t.created_at ?? "")
        }));

        if (!active) return;
        setTasks(normalized);
        await cacheServerTasks({ tasks: normalized.map((t) => ({
          id: Number(t.id),
          title: String(t.title ?? "Untitled"),
          status: String(t.status ?? "todo"),
          priority: normalizePriority(t.priority),
          created_at: String(t.created_at ?? "")
        })) });
      } catch (e: any) {
        if (!active) return;
        if (isProbablyOfflineError(e)) {
          setUsingOffline(true);
          const local = await listOfflineTasks();
          const visible = local.filter((t) => t.pending !== "delete");
          const mapped: Task[] = visible.map((t) => ({
            id: Number(t.local_id),
            client: undefined,
            assigned_to: null,
            title: String(t.title ?? "Untitled"),
            status: String(t.status ?? "todo"),
            priority: normalizePriority(t.priority),
            due_date: undefined,
            created_at: String(t.created_at ?? "")
          }));
          setTasks(mapped);
          setStatus("Offline mode: showing local tasks");
          return;
        }

        setTasks([]);
        setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to load tasks");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const activeTasks = tasks.filter((t) => !isDoneStatus(t.status));
  const completedTasks = tasks.filter((t) => isDoneStatus(t.status));

  async function onToggleComplete(task: Task) {
    if (!isAdmin) return;
    try {
      setStatus(null);
      setBusy(true);
      const nextDone = !isDoneStatus(task.status);
      const updated = await endpoints.tasks.update(task.id, {
        id: task.id,
        client: task.client,
        assigned_to: task.assigned_to ?? null,
        title: task.title,
        description: "",
        status: nextDone ? "done" : "todo",
        priority: normalizePriority(task.priority),
        due_date: task.due_date ?? null,
        linked_calendar_item: null
      });
      const t: any = updated.data;
      setUsingOffline(false);
      setTasks((prev) => {
        const next = prev.map((p) =>
          p.id === task.id
            ? {
                ...p,
                status: String(t.status ?? p.status ?? "todo"),
                priority: normalizePriority(t.priority ?? p.priority)
              }
            : p
        );
        cacheSnapshot(next);
        return next;
      });
    } catch (e: any) {
      if (isProbablyOfflineError(e)) {
        setUsingOffline(true);
        const updatedLocal = await setOfflineTaskStatus({
          local_id: task.id,
          status: !isDoneStatus(task.status) ? "done" : "todo"
        });
        const visible = updatedLocal.filter((t) => t.pending !== "delete");
        setTasks(
          visible.map((t) => ({
            id: Number(t.local_id),
            client: undefined,
            assigned_to: null,
            title: String(t.title ?? "Untitled"),
            status: String(t.status ?? "todo"),
            priority: normalizePriority(t.priority),
            due_date: undefined,
            created_at: String(t.created_at ?? "")
          }))
        );
        setStatus("Offline mode: task updated locally");
      } else {
        setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to update task");
      }
    } finally {
      setBusy(false);
    }
  }

  async function onClearCompleted() {
    if (!isAdmin) return;
    try {
      setStatus(null);
      setBusy(true);
      const done = tasks.filter((t) => isDoneStatus(t.status));
      for (const t of done) {
        await endpoints.tasks.remove(t.id);
      }
      setUsingOffline(false);
      setTasks((prev) => {
        const next = prev.filter((t) => !isDoneStatus(t.status));
        cacheSnapshot(next);
        return next;
      });
    } catch (e: any) {
      if (isProbablyOfflineError(e)) {
        setUsingOffline(true);
        const updatedLocal = await clearCompletedOfflineTasks();
        const visible = updatedLocal.filter((t) => t.pending !== "delete");
        setTasks(
          visible.map((t) => ({
            id: Number(t.local_id),
            client: undefined,
            assigned_to: null,
            title: String(t.title ?? "Untitled"),
            status: String(t.status ?? "todo"),
            priority: normalizePriority(t.priority),
            due_date: undefined,
            created_at: String(t.created_at ?? "")
          }))
        );
        setStatus("Offline mode: completed tasks cleared locally");
      } else {
        setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to clear completed tasks");
      }
    } finally {
      setBusy(false);
    }
  }

  async function onAddTask() {
    if (!isAdmin) return;
    if (!canAdd) return;
    try {
      setStatus(null);
      setBusy(true);
      const created = await endpoints.tasks.create({
        client: null,
        assigned_to: null,
        title: newTitle.trim(),
        description: "",
        status: "todo",
        priority: normalizePriority(newPriority),
        due_date: null,
        linked_calendar_item: null
      });
      const t: any = created.data;
      const next: Task = {
        id: Number(t.id),
        client: t.client != null ? Number(t.client) : undefined,
        assigned_to: t.assigned_to ?? null,
        title: String(t.title ?? "Untitled"),
        status: String(t.status ?? "todo"),
        priority: normalizePriority(t.priority),
        due_date: t.due_date,
        created_at: String(t.created_at ?? "")
      };
      setUsingOffline(false);
      setTasks((prev) => {
        const updatedList = [next, ...prev];
        cacheSnapshot(updatedList);
        return updatedList;
      });
      setNewTitle("");
      setNewPriority("med");
      setIsAddOpen(false);
    } catch (e: any) {
      if (isProbablyOfflineError(e)) {
        setUsingOffline(true);
        const updatedLocal = await addOfflineTask({ title: newTitle, priority: normalizePriority(newPriority) });
        const visible = updatedLocal.filter((t) => t.pending !== "delete");
        setTasks(
          visible.map((t) => ({
            id: Number(t.local_id),
            client: undefined,
            assigned_to: null,
            title: String(t.title ?? "Untitled"),
            status: String(t.status ?? "todo"),
            priority: normalizePriority(t.priority),
            due_date: undefined,
            created_at: String(t.created_at ?? "")
          }))
        );
        setNewTitle("");
        setNewPriority("med");
        setIsAddOpen(false);
        setStatus("Offline mode: task saved locally");
      } else {
        setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to add task");
      }
    } finally {
      setBusy(false);
    }
  }

  async function onSyncLocalToServer() {
    if (!isAdmin) return;
    try {
      setStatus(null);
      setBusy(true);
      const pending = await popPendingForSync();

      for (const r of pending) {
        if (r.pending === "create") {
          await endpoints.tasks.create({
            client: null,
            assigned_to: null,
            title: String(r.title ?? "Untitled"),
            description: "",
            status: String(r.status ?? "todo"),
            priority: normalizePriority(r.priority),
            due_date: null,
            linked_calendar_item: null
          });
          await deleteLocalRecord({ local_id: r.local_id });
        } else if (r.pending === "update" && r.server_id != null) {
          await endpoints.tasks.update(r.server_id, {
            id: r.server_id,
            client: null,
            assigned_to: null,
            title: String(r.title ?? "Untitled"),
            description: "",
            status: String(r.status ?? "todo"),
            priority: normalizePriority(r.priority),
            due_date: null,
            linked_calendar_item: null
          });
          await deleteLocalRecord({ local_id: r.local_id });
        } else if (r.pending === "delete") {
          if (r.server_id != null) {
            await endpoints.tasks.remove(r.server_id);
          }
          await deleteLocalRecord({ local_id: r.local_id });
        }
      }

      const res = await endpoints.tasks.list();
      const items = (res.data ?? []) as any[];
      const normalized: Task[] = items.map((t) => ({
        id: Number(t.id),
        client: t.client != null ? Number(t.client) : undefined,
        assigned_to: t.assigned_to ?? null,
        title: String(t.title ?? "Untitled"),
        status: String(t.status ?? "todo"),
        priority: normalizePriority(t.priority),
        due_date: t.due_date,
        created_at: String(t.created_at ?? "")
      }));
      setTasks(normalized);
      await cacheServerTasks({ tasks: normalized.map((t) => ({
        id: Number(t.id),
        title: String(t.title ?? "Untitled"),
        status: String(t.status ?? "todo"),
        priority: normalizePriority(t.priority),
        created_at: String(t.created_at ?? "")
      })) });

      setUsingOffline(false);
      setStatus(pending.length ? "Synced local tasks to server" : "No local task changes to sync");
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to sync tasks");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen
      subtitle="What needs attention next."
      statusText={status}
      overlay={
        isAdmin ? (
          <View pointerEvents="box-none" className="flex-1">
            <Pressable
              onPress={() => setIsAddOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Add task"
              hitSlop={10}
              style={{
                position: "absolute",
                right: 16,
                bottom: Math.max(16, insets.bottom + (__DEV__ ? 150 : 90))
              }}
              className="h-14 w-14 rounded-full bg-black/90 items-center justify-center shadow-lg"
            >
              <Text className="text-3xl font-semibold text-white" style={{ lineHeight: 30 }}>
                +
              </Text>
            </Pressable>
          </View>
        ) : undefined
      }
    >
      {usingOffline ? (
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-sm opacity-70">Offline mode</Text>
          {isAdmin ? (
            <Pressable onPress={onSyncLocalToServer} disabled={busy} className={busy ? "opacity-50" : ""}>
              <Badge label="Sync" />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <View className="rounded-2xl border border-gray-200 bg-white px-4 py-2">
        {activeTasks.length ? (
          <View>
            {activeTasks.map((item, idx) => (
              <View key={`active-${item.id}`}>
                {idx ? <View className="h-3" /> : null}
                <ListRow
                  title={item.title}
                  subtitle={`${priorityLabel(item.priority ?? "low")} • ${item.status ?? "status"}`}
                  onPress={isAdmin ? () => onToggleComplete(item) : undefined}
                  right={
                    isAdmin ? (
                      <Pressable onPress={() => onToggleComplete(item)} hitSlop={10} disabled={busy}>
                        <View className="flex-row items-center">
                          <View className={`h-2 w-2 rounded-full mr-2 ${priorityDotClass(item.priority ?? "low")}`} />
                          <Badge label="Mark done" />
                        </View>
                      </Pressable>
                    ) : (
                      <View className="flex-row items-center">
                        <View className={`h-2 w-2 rounded-full mr-2 ${priorityDotClass(item.priority ?? "low")}`} />
                        <Badge label="Open" />
                      </View>
                    )
                  }
                />
              </View>
            ))}
          </View>
        ) : (
          <View className="py-5">
            <Text className="opacity-70">No active tasks.</Text>
          </View>
        )}
      </View>

      {completedTasks.length ? (
        <Card>
          <SectionHeader
            title="Completed"
            actionLabel={isAdmin ? "Clear completed" : undefined}
            onPressAction={isAdmin && !busy ? onClearCompleted : undefined}
          />
          <View className="mt-3">
            {completedTasks.length ? (
              <View>
                {completedTasks.map((item, idx) => (
                  <View key={`done-${item.id}`}>
                    {idx ? <View className="h-3" /> : null}
                    <ListRow
                      title={item.title}
                      subtitle={`${priorityLabel(item.priority ?? "low")} • completed`}
                      onPress={isAdmin ? () => onToggleComplete(item) : undefined}
                      right={
                        isAdmin ? (
                          <Pressable onPress={() => onToggleComplete(item)} hitSlop={10} disabled={busy}>
                            <View className="flex-row items-center">
                              <View className={`h-2 w-2 rounded-full mr-2 ${priorityDotClass(item.priority ?? "low")}`} />
                              <Badge label="Undo" />
                            </View>
                          </Pressable>
                        ) : (
                          <View className="flex-row items-center">
                            <View className={`h-2 w-2 rounded-full mr-2 ${priorityDotClass(item.priority ?? "low")}`} />
                            <Badge label="Done" />
                          </View>
                        )
                      }
                    />
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </Card>
      ) : null}

      {isAdmin ? (
        <StackModal
          overlayKey="tasks:add"
          visible={isAddOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsAddOpen(false)}
        >
          <Pressable className="flex-1 bg-black/50 px-4 justify-center" onPress={() => setIsAddOpen(false)}>
            <Pressable onPress={() => {}}>
              <ModalSurface title="Add task">
                <View className="p-4">
                  <View>
                    <FloatingLabelInput
                      label="Title"
                      value={newTitle}
                      onChangeText={setNewTitle}
                      placeholder="e.g. Prepare content brief"
                    />
                  </View>

                  <View className="mt-3">
                    <Text className="text-xs opacity-70 mb-2">Priority</Text>
                    <View className="flex-row gap-2">
                      {(["high", "med", "low"] as TaskPriority[]).map((p) => {
                        const selected = p === newPriority;
                        return (
                          <Pressable
                            key={p}
                            onPress={() => setNewPriority(p)}
                            className={selected ? "opacity-100" : "opacity-60"}
                          >
                            <Badge label={priorityLabel(p)} />
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  <View className="flex-row justify-end gap-2 mt-4">
                    <Pressable onPress={() => setIsAddOpen(false)}>
                      <Badge label="Cancel" />
                    </Pressable>
                    <Pressable
                      onPress={onAddTask}
                      disabled={!canAdd || busy}
                      className={!canAdd || busy ? "opacity-50" : ""}
                    >
                      <Badge label="Save" />
                    </Pressable>
                  </View>
                </View>
              </ModalSurface>
            </Pressable>
          </Pressable>
        </StackModal>
      ) : null}
    </Screen>
  );
}
