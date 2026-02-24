import React, { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { endpoints } from "../services/endpoints";
import { addClientNote, listClientNotes, removeClientNote } from "../services/clientNotesStore";
import { isProbablyOfflineError } from "../utils/offline";
import { Badge, FloatingLabelInput, ListRow, ModalSurface, SectionHeader, StackModal } from "./ui";
import { useSession } from "../hooks/useSession";

type Props = {
  clientId: number;
  allowAdd?: boolean;
  compact?: boolean;
  refreshNonce?: number | string;
};

type Note = {
  id: number;
  client: number;
  content: string;
  pinned?: boolean;
  created_at?: string;
};

function splitNoteContent(content: string): { title: string; body: string } {
  const raw = String(content ?? "").replace(/\r\n/g, "\n").trim();
  if (!raw) return { title: "Untitled", body: "" };
  const [first, ...rest] = raw.split("\n");
  return { title: (first || "Untitled").trim(), body: rest.join("\n").trim() };
}

export default function NotesFeed({ clientId, allowAdd = true, compact = false, refreshNonce }: Props) {
  const { isAdmin } = useSession();

  const [notes, setNotes] = useState<Note[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [usingOffline, setUsingOffline] = useState(false);

  const canEdit = isAdmin;
  const canAdd = allowAdd && canEdit;

  const canSave = useMemo(() => title.trim().length > 0, [title]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setStatus(null);
        setUsingOffline(false);
        const res = await endpoints.notes.list({ client: clientId });
        if (!active) return;
        setNotes((res.data ?? []) as Note[]);
      } catch (e: any) {
        if (!active) return;
        if (isProbablyOfflineError(e)) {
          setUsingOffline(true);
          const local = await listClientNotes(clientId);
          const mapped: Note[] = local.map((n) => ({
            id: Number(n.id),
            client: Number(clientId),
            content: [String(n.title ?? "").trim(), String(n.body ?? "").trim()].filter(Boolean).join("\n"),
            pinned: false,
            created_at: String(n.created_at ?? "")
          }));
          setNotes(mapped);
          setStatus("Offline mode: showing local notes");
          return;
        }

        setNotes([]);
        setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to load notes");
      }
    })();
    return () => {
      active = false;
    };
  }, [clientId, refreshNonce]);

  async function onAdd() {
    if (!canAdd) return;
    if (!canSave) return;
    try {
      setStatus(null);
      setBusy(true);
      const content = [title.trim(), body.trim()].filter(Boolean).join("\n");
      const created = await endpoints.notes.create({ client: clientId, content, pinned: false });
      setUsingOffline(false);
      setNotes((prev) => [created.data as Note, ...prev]);
      setTitle("");
      setBody("");
      setIsOpen(false);
    } catch (e: any) {
      if (isProbablyOfflineError(e)) {
        setUsingOffline(true);
        const updatedLocal = await addClientNote({ clientId, title, body });
        const mapped: Note[] = updatedLocal.map((n) => ({
          id: Number(n.id),
          client: Number(clientId),
          content: [String(n.title ?? "").trim(), String(n.body ?? "").trim()].filter(Boolean).join("\n"),
          pinned: false,
          created_at: String(n.created_at ?? "")
        }));
        setNotes(mapped);
        setTitle("");
        setBody("");
        setIsOpen(false);
        setStatus("Offline mode: note saved locally");
      } else {
        setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to add note");
      }
    } finally {
      setBusy(false);
    }
  }

  async function onRemove(id: number) {
    if (!canEdit) return;
    try {
      setStatus(null);
      setBusy(true);
      await endpoints.notes.remove(id);
      setUsingOffline(false);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (e: any) {
      if (isProbablyOfflineError(e)) {
        setUsingOffline(true);
        await removeClientNote({ clientId, id });
        setNotes((prev) => prev.filter((n) => n.id !== id));
        setStatus("Offline mode: note removed locally");
      } else {
        setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to remove note");
      }
    } finally {
      setBusy(false);
    }
  }

  async function onSyncLocalToServer() {
    if (!canEdit) return;
    try {
      setStatus(null);
      setBusy(true);
      const local = await listClientNotes(clientId);
      for (const n of local) {
        const content = [String(n.title ?? "").trim(), String(n.body ?? "").trim()].filter(Boolean).join("\n");
        await endpoints.notes.create({ client: clientId, content, pinned: false });
        await removeClientNote({ clientId, id: n.id });
      }

      const res = await endpoints.notes.list({ client: clientId });
      setNotes((res.data ?? []) as Note[]);
      setUsingOffline(false);
      setStatus(local.length ? "Synced local notes to server" : "No local notes to sync");
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to sync notes");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View>
      <SectionHeader
        title="Notes"
        variant="card"
        titleClassName={compact ? "text-sm font-semibold" : undefined}
        action={
          canAdd ? (
            <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
              <Ionicons name="add" size={22} color="#111827" />
            </View>
          ) : undefined
        }
        onPressAction={canAdd ? () => setIsOpen(true) : undefined}
      />

      {usingOffline ? (
        <View className="mt-2 flex-row items-center justify-between">
          <Text className={compact ? "text-xs opacity-70" : "text-sm opacity-70"}>Offline mode</Text>
          {canEdit ? (
            <Pressable onPress={onSyncLocalToServer} disabled={busy} className={busy ? "opacity-50" : ""}>
              <Badge label="Sync" />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <View className="mt-2">
        {notes.length === 0 ? (
          <View className="py-2">
            <Text className={compact ? "text-xs opacity-70" : "text-sm opacity-70"}>
              {status ? status : "No notes yet."}
            </Text>
          </View>
        ) : (
          notes.map((n) => (
            (() => {
              const parsed = splitNoteContent(n.content);
              return (
            <ListRow
              key={n.id}
              title={parsed.title}
              subtitle={parsed.body || "—"}
              titleClassName={compact ? "text-sm font-semibold" : undefined}
              subtitleClassName={compact ? "text-xs opacity-70 mt-1" : undefined}
              right={
                canEdit ? (
                  <Pressable onPress={() => onRemove(n.id)} hitSlop={10}>
                    <Badge label="Remove" />
                  </Pressable>
                ) : undefined
              }
            />
              );
            })()
          ))
        )}
      </View>

      {canAdd ? (
        <StackModal overlayKey={`client-notes:add:${clientId}`} visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
          <Pressable className="flex-1 bg-black/50 px-4 justify-center" onPress={() => setIsOpen(false)}>
            <Pressable onPress={() => {}}>
              <ModalSurface title="Add note">
                <View className="p-4">
                  <View>
                    <FloatingLabelInput label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Kickoff recap" />
                  </View>

                  <View className="mt-3">
                    <FloatingLabelInput
                      label="Details"
                      value={body}
                      onChangeText={setBody}
                      placeholder="Optional"
                      multiline
                      style={{ minHeight: 80, textAlignVertical: "top" }}
                    />
                  </View>

                  <View className="flex-row justify-end gap-2 mt-4">
                    <Pressable onPress={() => setIsOpen(false)}>
                      <Badge label="Cancel" />
                    </Pressable>
                    <Pressable onPress={onAdd} disabled={!canSave || busy} className={!canSave || busy ? "opacity-50" : ""}>
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
