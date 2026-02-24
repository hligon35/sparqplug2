import { getFirestore } from '../config/firebaseAdmin.js';

export class UserService {
  static async getUserProfile(uid) {
    const doc = await getFirestore().collection('users').doc(uid).get();
    if (!doc.exists) return { id: uid };
    return { id: uid, ...doc.data() };
  }

  static async ensureUserProfile(uid, data = {}) {
    const ref = getFirestore().collection('users').doc(uid);
    const existing = await ref.get();
    if (existing.exists) return { id: uid, ...existing.data() };
    await ref.set({
      ...data,
      createdAt: Date.now()
    });
    const created = await ref.get();
    return { id: uid, ...created.data() };
  }
}
