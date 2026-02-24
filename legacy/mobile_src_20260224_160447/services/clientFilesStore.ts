import AsyncStorage from "@react-native-async-storage/async-storage";

export type ClientFile = {
  id: number;
  clientId: number;
  name: string;
  type: string;
  sizeLabel: string;
  created_at: string;
};

function key(clientId: number) {
  return `sparqplug.client.${clientId}.files.v1`;
}

async function readAll(clientId: number): Promise<ClientFile[]> {
  const raw = await AsyncStorage.getItem(key(clientId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((f: any) => ({
        id: Number(f.id),
        clientId: Number(clientId),
        name: String(f.name ?? ""),
        type: String(f.type ?? "FILE"),
        sizeLabel: String(f.sizeLabel ?? ""),
        created_at: String(f.created_at ?? "")
      }))
      .filter((f: ClientFile) => Number.isFinite(f.id) && !!f.name);
  } catch {
    return [];
  }
}

async function writeAll(clientId: number, list: ClientFile[]): Promise<void> {
  await AsyncStorage.setItem(key(clientId), JSON.stringify(list));
}

export async function listClientFiles(clientId: number): Promise<ClientFile[]> {
  const list = await readAll(clientId);
  return list.slice().sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
}

export async function addClientFile(params: {
  clientId: number;
  name: string;
  type: string;
  sizeLabel: string;
}): Promise<ClientFile[]> {
  const list = await listClientFiles(params.clientId);
  const next: ClientFile = {
    id: Date.now(),
    clientId: params.clientId,
    name: params.name.trim() || "untitled.txt",
    type: params.type.trim().toUpperCase() || "FILE",
    sizeLabel: params.sizeLabel.trim() || "—",
    created_at: new Date().toISOString()
  };
  const updated = [next, ...list];
  await writeAll(params.clientId, updated);
  return updated;
}

export async function removeClientFile(params: { clientId: number; id: number }): Promise<ClientFile[]> {
  const list = await listClientFiles(params.clientId);
  const updated = list.filter((f) => f.id !== params.id);
  await writeAll(params.clientId, updated);
  return updated;
}
