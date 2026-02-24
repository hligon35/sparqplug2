export type ApiFailure = {
  id: string;
  at: number;
  method?: string;
  url?: string;
  status?: number;
  requestId?: string;
  errorId?: string;
  message?: string;
};

type Listener = () => void;

const MAX_ITEMS = 50;

let items: ApiFailure[] = [];
const listeners = new Set<Listener>();

function notify() {
  for (const l of listeners) l();
}

export const debugStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  getApiFailures(): ApiFailure[] {
    return items;
  },

  addApiFailure(failure: Omit<ApiFailure, "id" | "at"> & { at?: number }) {
    const entry: ApiFailure = {
      id: `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`,
      at: failure.at ?? Date.now(),
      ...failure
    };

    items = [entry, ...items].slice(0, MAX_ITEMS);
    notify();
  },

  clearApiFailures() {
    items = [];
    notify();
  }
};

// --- Change Summary ---
// Added a tiny in-memory debug store to capture and display recent API failures (status/request_id/error_id).
