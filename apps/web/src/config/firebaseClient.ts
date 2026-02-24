import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

function requiredViteEnv(key: string): string {
  const value = (import.meta.env as Record<string, unknown>)[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(
      `[SparQ Plug] Missing ${key}. Set it in apps/web/.env.local and restart the Vite dev server.`
    );
  }
  return value;
}

const firebaseConfig = {
  apiKey: requiredViteEnv('VITE_FIREBASE_API_KEY'),
  authDomain: requiredViteEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: requiredViteEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: requiredViteEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: requiredViteEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: requiredViteEnv('VITE_FIREBASE_APP_ID')
};

export const firebaseApp = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
