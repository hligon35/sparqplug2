export class NotificationService {
  static async sendToUser(uid, payload) {
    // Firebase FCM stub; wire up messaging() later.
    return { ok: true, uid, payload };
  }
}
