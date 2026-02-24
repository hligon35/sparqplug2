import AsyncStorage from "@react-native-async-storage/async-storage";

export type LinkedMailboxProvider = "google" | "microsoft" | "yahoo" | "other";

export type LinkedMailbox = {
  id: number;
  provider: LinkedMailboxProvider;
  email: string;
  created_at: string;
};

const KEY = "sparqplug.email.linkedMailboxes.v1";

function normalizeProvider(p: string): LinkedMailboxProvider {
  const v = (p ?? "").toLowerCase();
  if (v === "google" || v === "microsoft" || v === "yahoo" || v === "other") return v;
  return "other";
}

async function readAll(): Promise<LinkedMailbox[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((m: any) => ({
        id: Number(m.id),
        provider: normalizeProvider(m.provider),
        email: String(m.email ?? ""),
        created_at: String(m.created_at ?? "")
      }))
      .filter((m: LinkedMailbox) => Number.isFinite(m.id) && !!m.email);
  } catch {
    return [];
  }
}

async function writeAll(list: LinkedMailbox[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

export async function listLinkedMailboxes(): Promise<LinkedMailbox[]> {
  const list = await readAll();
  return list.slice().sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function linkMailbox(params: {
  provider: LinkedMailboxProvider;
  email?: string;
}): Promise<LinkedMailbox[]> {
  const list = await readAll();

  const email = (params.email ?? "").trim() || `demo+${params.provider}@sparqplug.app`;
  const exists = list.some((m) => m.email.toLowerCase() === email.toLowerCase());
  if (exists) return list;

  const next: LinkedMailbox = {
    id: Date.now(),
    provider: params.provider,
    email,
    created_at: new Date().toISOString()
  };

  const updated = [next, ...list];
  await writeAll(updated);
  return updated;
}

export async function unlinkMailbox(id: number): Promise<LinkedMailbox[]> {
  const list = await readAll();
  const updated = list.filter((m) => m.id !== id);
  await writeAll(updated);
  return updated;
}
