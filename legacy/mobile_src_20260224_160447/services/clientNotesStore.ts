import AsyncStorage from "@react-native-async-storage/async-storage";

export type ClientNote = {
  id: number;
  clientId: number;
  title: string;
  body: string;
  created_at: string;
};

function key(clientId: number) {
  return `sparqplug.client.${clientId}.notes.v1`;
}

async function readAll(clientId: number): Promise<ClientNote[]> {
  const raw = await AsyncStorage.getItem(key(clientId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((n: any) => ({
        id: Number(n.id),
        clientId: Number(clientId),
        title: String(n.title ?? ""),
        body: String(n.body ?? ""),
        created_at: String(n.created_at ?? "")
      }))
      .filter((n: ClientNote) => Number.isFinite(n.id) && !!n.title);
  } catch {
    return [];
  }
}

async function writeAll(clientId: number, list: ClientNote[]): Promise<void> {
  await AsyncStorage.setItem(key(clientId), JSON.stringify(list));
}

export async function listClientNotes(clientId: number): Promise<ClientNote[]> {
  const list = await readAll(clientId);
  return list.slice().sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
}

export async function addClientNote(params: {
  clientId: number;
  title: string;
  body: string;
}): Promise<ClientNote[]> {
  const list = await listClientNotes(params.clientId);
  const next: ClientNote = {
    id: Date.now(),
    clientId: params.clientId,
    title: params.title.trim() || "Untitled",
    body: params.body.trim(),
    created_at: new Date().toISOString()
  };
  const updated = [next, ...list];
  await writeAll(params.clientId, updated);
  return updated;
}

export async function upsertClientNote(params: {
  clientId: number;
  title: string;
  body: string;
}): Promise<ClientNote[]> {
  const title = params.title.trim() || "Untitled";
  const body = params.body.trim();

  const list = await listClientNotes(params.clientId);
  const idx = list.findIndex((n) => n.title.trim().toLowerCase() === title.trim().toLowerCase());

  // Empty body means delete the existing note (if any).
  if (!body) {
    const updated = idx >= 0 ? list.filter((_, i) => i !== idx) : list;
    await writeAll(params.clientId, updated);
    return updated;
  }

  const next: ClientNote = {
    id: Date.now(),
    clientId: params.clientId,
    title,
    body,
    created_at: new Date().toISOString()
  };

  const updated = [next, ...list.filter((_, i) => i !== idx)];
  await writeAll(params.clientId, updated);
  return updated;
}

export async function removeClientNote(params: { clientId: number; id: number }): Promise<ClientNote[]> {
  const list = await listClientNotes(params.clientId);
  const updated = list.filter((n) => n.id !== params.id);
  await writeAll(params.clientId, updated);
  return updated;
}
