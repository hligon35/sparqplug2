import { endpoints } from "./endpoints";

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  username: string;
  role?: string;
  avatar_url?: string;
};

export type SessionState = {
  user: SessionUser | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
};

type Listener = () => void;

let state: SessionState = {
  user: null,
  isAdmin: false,
  loading: false,
  error: null
};

const listeners = new Set<Listener>();

function notify() {
  for (const l of listeners) l();
}

function toErrorMessage(e: any): string {
  return e?.response?.data?.detail ?? e?.message ?? "Unable to load session";
}

function computeIsAdmin(user: SessionUser | null): boolean {
  const role = String(user?.role ?? "").toLowerCase().trim();
  // Backend uses is_staff/is_superuser for actual authorization.
  // On mobile we only need a best-effort UI gate.
  return role === "admin";
}

export const sessionStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  getState(): SessionState {
    return state;
  },

  clear() {
    state = { user: null, isAdmin: false, loading: false, error: null };
    notify();
  },

  async refresh(): Promise<SessionState> {
    state = { ...state, loading: true, error: null };
    notify();

    try {
      const res = await endpoints.users.me();
      const u = res.data as SessionUser;
      state = {
        user: u,
        isAdmin: computeIsAdmin(u),
        loading: false,
        error: null
      };
      notify();
      return state;
    } catch (e: any) {
      // Best-effort; if unauthenticated, keep user null.
      state = {
        user: null,
        isAdmin: false,
        loading: false,
        error: toErrorMessage(e)
      };
      notify();
      return state;
    }
  },

  async updateMe(payload: Partial<Pick<SessionUser, "name" | "email" | "avatar_url">>) {
    state = { ...state, loading: true, error: null };
    notify();

    try {
      const res = await endpoints.users.updateMe(payload);
      const u = res.data as SessionUser;
      state = {
        user: u,
        isAdmin: computeIsAdmin(u),
        loading: false,
        error: null
      };
      notify();
      return state;
    } catch (e: any) {
      state = { ...state, loading: false, error: toErrorMessage(e) };
      notify();
      throw e;
    }
  }
};
