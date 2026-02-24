import React, { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { endpoints } from "../services/endpoints";
import { addClientFile, listClientFiles, removeClientFile } from "../services/clientFilesStore";
import { isProbablyOfflineError } from "../utils/offline";
import { Badge, FloatingLabelInput, ListRow, ModalSurface, SectionHeader, StackModal } from "./ui";
import { useSession } from "../hooks/useSession";

type Props = {
  clientId: number;
};

type ClientFile = {
  id: number;
  client: number;
  file_url: string;
  file_type?: string;
  description?: string;
  created_at?: string;
};

export default function FileManager({ clientId }: Props) {
  const { isAdmin } = useSession();

  const [files, setFiles] = useState<ClientFile[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [fileUrl, setFileUrl] = useState("");
  const [fileType, setFileType] = useState("PDF");
  const [description, setDescription] = useState("");

  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [usingOffline, setUsingOffline] = useState(false);

  const canSave = useMemo(() => fileUrl.trim().length > 0, [fileUrl]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setStatus(null);
        setUsingOffline(false);
        const res = await endpoints.files.list({ client: clientId });
        if (!active) return;
        setFiles((res.data ?? []) as ClientFile[]);
      } catch (e: any) {
        if (!active) return;
        if (isProbablyOfflineError(e)) {
          setUsingOffline(true);
          const local = await listClientFiles(clientId);
          const mapped: ClientFile[] = local.map((f) => ({
            id: Number(f.id),
            client: Number(clientId),
            file_url: String((f as any).name ?? ""),
            file_type: String((f as any).type ?? "FILE"),
            description: String((f as any).sizeLabel ?? ""),
            created_at: String((f as any).created_at ?? "")
          }));
          setFiles(mapped);
          setStatus("Offline mode: showing local files");
          return;
        }

        setFiles([]);
        setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to load files");
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
      const created = await endpoints.files.create({
        client: clientId,
        file_url: fileUrl.trim(),
        file_type: fileType.trim(),
        description: description.trim()
      });
      setUsingOffline(false);
      setFiles((prev) => [created.data as ClientFile, ...prev]);
      setFileUrl("");
      setFileType("PDF");
      setDescription("");
      setIsOpen(false);
    } catch (e: any) {
      if (isProbablyOfflineError(e)) {
        setUsingOffline(true);
        const updatedLocal = await addClientFile({
          clientId,
          name: fileUrl.trim(),
          type: fileType.trim(),
          sizeLabel: description.trim()
        });
        const mapped: ClientFile[] = updatedLocal.map((f) => ({
          id: Number(f.id),
          client: Number(clientId),
          file_url: String((f as any).name ?? ""),
          file_type: String((f as any).type ?? "FILE"),
          description: String((f as any).sizeLabel ?? ""),
          created_at: String((f as any).created_at ?? "")
        }));
        setFiles(mapped);
        setFileUrl("");
        setFileType("PDF");
        setDescription("");
        setIsOpen(false);
        setStatus("Offline mode: file saved locally");
      } else {
        setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to add file");
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
      await endpoints.files.remove(id);
      setUsingOffline(false);
      setFiles((prev) => prev.filter((f) => f.id !== id));
    } catch (e: any) {
      if (isProbablyOfflineError(e)) {
        setUsingOffline(true);
        await removeClientFile({ clientId, id });
        setFiles((prev) => prev.filter((f) => f.id !== id));
        setStatus("Offline mode: file removed locally");
      } else {
        setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to remove file");
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
      const local = await listClientFiles(clientId);
      for (const f of local) {
        const file_url = String((f as any).name ?? "").trim();
        const file_type = String((f as any).type ?? "FILE").trim();
        const description = String((f as any).sizeLabel ?? "").trim();
        if (!file_url) continue;
        await endpoints.files.create({ client: clientId, file_url, file_type, description });
        await removeClientFile({ clientId, id: f.id });
      }

      const res = await endpoints.files.list({ client: clientId });
      setFiles((res.data ?? []) as ClientFile[]);
      setUsingOffline(false);
      setStatus(local.length ? "Synced local files to server" : "No local files to sync");
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to sync files");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View>
      <SectionHeader
        title="Files"
        variant="card"
        action={
          isAdmin ? (
            <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
              <Ionicons name="cloud-upload-outline" size={18} color="#111827" />
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
        {files.length === 0 ? (
          <View className="py-2">
            <Text className="text-sm opacity-70">{status ? status : "No files yet."}</Text>
          </View>
        ) : (
          files.map((f) => (
            <ListRow
              key={f.id}
              title={String(f.file_url ?? "—")}
              subtitle={String(f.description ?? "—")}
              right={
                <View className="flex-row gap-2">
                  <Badge label={String(f.file_type ?? "FILE").toUpperCase()} />
                  {isAdmin ? (
                    <Pressable onPress={() => onRemove(f.id)} hitSlop={10} disabled={busy}>
                      <Badge label="Remove" />
                    </Pressable>
                  ) : null}
                </View>
              }
            />
          ))
        )}
      </View>
      
      {isAdmin ? (
        <StackModal overlayKey={`client-files:add:${clientId}`} visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
          <Pressable className="flex-1 bg-black/50 px-4 justify-center" onPress={() => setIsOpen(false)}>
            <Pressable onPress={() => {}}>
              <ModalSurface title="Upload file">
                <View className="p-4">
                  <View>
                    <FloatingLabelInput
                      label="File URL"
                      value={fileUrl}
                      onChangeText={setFileUrl}
                      placeholder="https://..."
                      autoCapitalize="none"
                    />
                  </View>

                  <View className="mt-3">
                    <FloatingLabelInput label="Type" value={fileType} onChangeText={setFileType} placeholder="PDF" />
                  </View>

                  <View className="mt-3">
                    <FloatingLabelInput
                      label="Description"
                      value={description}
                      onChangeText={setDescription}
                      placeholder="Optional"
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
