import React from "react";

import { sessionStore, type SessionState } from "../services/sessionStore";

export function useSession(): SessionState {
  const [snap, setSnap] = React.useState<SessionState>(() => sessionStore.getState());

  React.useEffect(() => {
    return sessionStore.subscribe(() => setSnap(sessionStore.getState()));
  }, []);

  return snap;
}
