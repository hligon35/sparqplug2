import { setFirebaseIdTokenProvider } from "./api";

// Optional bridge: if you decide to use Firebase Auth for user identity,
// call enableFirebaseAuthForApi() once during bootstrap.
// This is intentionally not auto-enabled to avoid breaking existing auth.

export function enableFirebaseAuthForApi() {
  setFirebaseIdTokenProvider(async () => {
    try {
      const mod = await import("../../firebase/client/auth");
      return await mod.getFirebaseIdToken();
    } catch {
      return null;
    }
  });
}

export function disableFirebaseAuthForApi() {
  setFirebaseIdTokenProvider(null);
}
