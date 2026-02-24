import admin from 'firebase-admin';
import { config } from './config.js';

function normalizePrivateKey(privateKey) {
  if (!privateKey) return privateKey;
  return privateKey.replace(/\\n/g, '\n');
}

export function getFirebaseAdmin() {
  if (admin.apps.length > 0) return admin;

  const projectId = config.FIREBASE_PROJECT_ID;
  const clientEmail = config.FIREBASE_CLIENT_EMAIL;
  const privateKey = normalizePrivateKey(config.FIREBASE_PRIVATE_KEY);

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase Admin credentials in env (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)');
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey
    })
  });

  return admin;
}

export function getAuth() {
  return getFirebaseAdmin().auth();
}

export function getFirestore() {
  return getFirebaseAdmin().firestore();
}

export function getStorage() {
  return getFirebaseAdmin().storage();
}

// Convenience exports (spec-friendly)
export const auth = () => getAuth();
export const firestore = () => getFirestore();
export const storage = () => getStorage();
