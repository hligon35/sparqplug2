import React, { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { endpoints } from "../services/endpoints";
import {
  addChecklistItem,
  listChecklist,
  removeChecklistItem,
  toggleChecklistItem
} from "../services/clientChecklistStore";
import { isProbablyOfflineError } from "../utils/offline";
import { normalizePriority, priorityLabel, type TaskPriority } from "../services/taskPriority";
import { Badge, FloatingLabelInput, ListRow, SectionHeader, StackModal, ModalSurface } from "./ui";
import { useSession } from "../hooks/useSession";

type Props = {
  clientId: number;
};

type ClientTask = {
  id: number;
  client: number;
  title: string;
  description?: string;
  status?: string;
  priority?: TaskPriority;
  due_date?: string | null;
  linked_calendar_item?: number | null;
  assigned_to?: number | null;
  created_at?: string;
};

function isDoneStatus(status: unknown): boolean {
  const s = String(status ?? "").toLowerCase().trim();
  return s === "done" || s === "completed";
}

const PRIORITIES: TaskPriority[] = ["high", "med", "low"];

export default function TaskList({ clientId }: Props) {
  const { isAdmin } = useSession();

  const [items, setItems] = useState<ClientTask[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("med");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [usingOffline, setUsingOffline] = useState(false);

  const canSave = useMemo(() => title.trim().length > 0, [title]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setStatus(null);
        setUsingOffline(false);
        const res = await endpoints.tasks.list({ client: clientId });
        if (!active) return;
        const data = (res.data ?? []) as any[];
        const normalized: ClientTask[] = data.map((t) => ({
          id: Number(t.id),
          client: Number(t.client),
          title: String(t.title ?? "Untitled"),
          description: String(t.description ?? ""),
          status: String(t.status ?? "todo"),
          priority: normalizePriority(t.priority),
          due_date: t.due_date ?? null,
          linked_calendar_item: t.linked_calendar_item ?? null,
          assigned_to: t.assigned_to ?? null,
          created_at: String(t.created_at ?? "")
        }));
        setItems(normalized);
      } catch (e: any) {
        if (!active) return;
        if (isProbablyOfflineError(e)) {
          setUsingOffline(true);
          const local = await listChecklist(clientId);
          const mapped: ClientTask[] = local.map((i) => ({
            id: Number(i.id),
            client: Number(clientId),
            title: String(i.title ?? "Untitled"),
            description: "",
            status: i.done ? "done" : "todo",
            priority: normalizePriority(i.priority),
            due_date: null,
            linked_calendar_item: null,
            assigned_to: null,
            created_at: String(i.created_at ?? "")
          }));
          setItems(mapped);
          setStatus("Offline mode: showing local checklist");
          return;
        }

        setItems([]);
        setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to load checklist");
      }
    })();
    return () => {
      active = false;
    };
  }, [clientId]);

  async function onAdd() {
    if (!isAdmin) return;
    if (!canSave) return;
    try {
      setStatus(null);
      setBusy(true);
      const created = await endpoints.tasks.create({
        client: clientId,
        title: title.trim(),
        description: "",
        status: "todo",
        priority: normalizePriority(priority),
        due_date: null,
        linked_calendar_item: null,
        assigned_to: null
      });
      const t: any = created.data;
      const next: ClientTask = {
        id: Number(t.id),
        client: Number(t.client),
        title: String(t.title ?? "Untitled"),
        description: String(t.description ?? ""),
        status: String(t.status ?? "todo"),
        priority: normalizePriority(t.priority),
        due_date: t.due_date ?? null,
        linked_calendar_item: t.linked_calendar_item ?? null,
        assigned_to: t.assigned_to ?? null,
        created_at: String(t.created_at ?? "")
      };
      setUsingOffline(false);
      setItems((prev) => [next, ...prev]);
      setTitle("");
      setPriority("med");
      setIsOpen(false);
    } catch (e: any) {
      if (isProbablyOfflineError(e)) {
        setUsingOffline(true);
        const updated = await addChecklistItem({ clientId, title, priority: normalizePriority(priority) });
        const mapped: ClientTask[] = updated.map((i) => ({
          id: Number(i.id),
          client: Number(clientId),
          title: String(i.title ?? "Untitled"),
          description: "",
          status: i.done ? "done" : "todo",
          priority: normalizePriority(i.priority),
          due_date: null,
          linked_calendar_item: null,
          assigned_to: null,
          created_at: String(i.created_at ?? "")
        }));
        setItems(mapped);
        setTitle("");
        setPriority("med");
        setIsOpen(false);
        setStatus("Offline mode: checklist item saved locally");
      } else {
        setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to add checklist item");
      }
    } finally {
      setBusy(false);
    }
  }

  async function onToggle(item: ClientTask) {
    if (!isAdmin) return;
    try {
      setStatus(null);
      setBusy(true);
      const nextDone = !isDoneStatus(item.status);
      const updated = await endpoints.tasks.update(item.id, {
        id: item.id,
        client: clientId,
        assigned_to: item.assigned_to ?? null,
        title: item.title,
        description: item.description ?? "",
        status: nextDone ? "done" : "todo",
        priority: normalizePriority(item.priority),
        due_date: item.due_date ?? null,
        linked_calendar_item: item.linked_calendar_item ?? null
      });
      const t: any = updated.data;
      setUsingOffline(false);
      setItems((prev) =>
        prev.map((p) =>
          p.id === item.id
            ? {
                ...p,
                status: String(t.status ?? p.status ?? "todo"),
                priority: normalizePriority(t.priority ?? p.priority)
              }
            : p
        )
      );
    } catch (e: any) {
      if (isProbablyOfflineError(e)) {
        setUsingOffline(true);
        const updated = await toggleChecklistItem({ clientId, id: item.id, done: !isDoneStatus(item.status) });
        const mapped: ClientTask[] = updated.map((i) => ({
          id: Number(i.id),
          client: Number(clientId),
          title: String(i.title ?? "Untitled"),
          description: "",
          status: i.done ? "done" : "todo",
          priority: normalizePriority(i.priority),
          due_date: null,
          linked_calendar_item: null,
          assigned_to: null,
          created_at: String(i.created_at ?? "")
        }));
        setItems(mapped);
        setStatus("Offline mode: checklist updated locally");
      } else {
        setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to update checklist item");
      }
    } finally {
      setBusy(false);
    }
  }

  async function onRemove(id: number) {
    if (!isAdmin) return;
    try {
      setStatus(null);
      setBusy(true);
      await endpoints.tasks.remove(id);
      setUsingOffline(false);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e: any) {
      if (isProbablyOfflineError(e)) {
        setUsingOffline(true);
        const updated = await removeChecklistItem({ clientId, id });
        const mapped: ClientTask[] = updated.map((i) => ({
          id: Number(i.id),
          client: Number(clientId),
          title: String(i.title ?? "Untitled"),
          description: "",
          status: i.done ? "done" : "todo",
          priority: normalizePriority(i.priority),
          due_date: null,
          linked_calendar_item: null,
          assigned_to: null,
          created_at: String(i.created_at ?? "")
        }));
        setItems(mapped);
        setStatus("Offline mode: checklist item removed locally");
      } else {
        setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to remove checklist item");
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
      const local = await listChecklist(clientId);
      for (const i of local) {
        await endpoints.tasks.create({
          client: clientId,
          title: String(i.title ?? "Untitled"),
          description: "",
          status: i.done ? "done" : "todo",
          priority: normalizePriority(i.priority),
          due_date: null,
          linked_calendar_item: null,
          assigned_to: null
        });
        await removeChecklistItem({ clientId, id: i.id });
      }

      const res = await endpoints.tasks.list({ client: clientId });
      const data = (res.data ?? []) as any[];
      const normalized: ClientTask[] = data.map((t) => ({
        id: Number(t.id),
        client: Number(t.client),
        title: String(t.title ?? "Untitled"),
        description: String(t.description ?? ""),
        status: String(t.status ?? "todo"),
        priority: normalizePriority(t.priority),
        due_date: t.due_date ?? null,
        linked_calendar_item: t.linked_calendar_item ?? null,
        assigned_to: t.assigned_to ?? null,
        created_at: String(t.created_at ?? "")
      }));
      setItems(normalized);
      setUsingOffline(false);
      setStatus(local.length ? "Synced local checklist to server" : "No local checklist items to sync");
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to sync checklist");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View>
      <SectionHeader
        title="Checklist"
        variant="card"
        action={
          isAdmin ? (
            <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
              <Ionicons name="add" size={22} color="#111827" />
            </View>
          ) : undefined
        }
        onPressAction={isAdmin ? () => setIsOpen(true) : undefined}
      />

      {usingOffline ? (
        <View className="mt-2 flex-row items-center justify-between">
          <Text className="text-sm opacity-70">Offline mode</Text>
          {isAdmin ? (
            <Pressable onPress={onSyncLocalToServer} disabled={busy} className={busy ? "opacity-50" : ""}>
              <Badge label="Sync" />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <View className="mt-2">
        {items.length === 0 ? (
          <View className="py-2">
            <Text className="text-sm opacity-70">{status ? status : "No checklist items yet."}</Text>
          </View>
        ) : (
          items.map((i) => (
            <ListRow
              key={i.id}
              title={i.title}
              subtitle={isDoneStatus(i.status) ? "Completed" : "Open"}
              onPress={isAdmin ? () => onToggle(i) : undefined}
              right={
                isAdmin ? (
                  <View className="items-end gap-2">
                    <Badge label={priorityLabel(normalizePriority(i.priority))} />
                    <View className="flex-row gap-2">
                      <Pressable onPress={() => onToggle(i)} hitSlop={10} disabled={busy}>
                        <Badge label={isDoneStatus(i.status) ? "Undo" : "Done"} />
                      </Pressable>
                      <Pressable onPress={() => onRemove(i.id)} hitSlop={10} disabled={busy}>
                        <Badge label="Remove" />
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View className="items-end">
                    <Badge label={priorityLabel(normalizePriority(i.priority))} />
                  </View>
                )
              }
            />
          ))
        )}
      </View>

      {isAdmin ? (
        <StackModal
          overlayKey={`client-checklist:add:${clientId}`}
          visible={isOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsOpen(false)}
        >
          <Pressable className="flex-1 bg-black/50 px-4 justify-center" onPress={() => setIsOpen(false)}>
            <Pressable onPress={() => {}}>
              <ModalSurface title="Add checklist item">
                <View className="p-4">
                  <View>
                    <FloatingLabelInput
                      label="Title"
                      value={title}
                      onChangeText={setTitle}
                      placeholder="e.g. Draft content plan"
                    />
                  </View>

                  <View className="mt-3">
                    <Text className="text-xs opacity-70 mb-2">Priority</Text>
                    <View className="flex-row gap-2">
                      {PRIORITIES.map((p) => {
                        const selected = p === priority;
                        return (
                          <Pressable
                            key={p}
                            onPress={() => setPriority(p)}
                            className={selected ? "opacity-100" : "opacity-60"}
                          >
                            <Badge label={priorityLabel(p)} />
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  <View className="flex-row justify-end gap-2 mt-4">
                    <Pressable onPress={() => setIsOpen(false)}>
                      <Badge label="Cancel" />
                    </Pressable>
                    <Pressable
                      onPress={onAdd}
                      disabled={!canSave || busy}
                      className={!canSave || busy ? "opacity-50" : ""}
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
    </View>
  );
}
