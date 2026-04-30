import admin from "firebase-admin";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export class NotificationService {
  private client: admin.app.App;
  constructor() {
    var serviceAccount = JSON.parse(
      readFileSync(
        resolve(
          "./src/config/socialapp-47665-firebase-adminsdk-fbsvc-2194f24be1.json"
        )
      ) as unknown as string
    );
    this.client = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  async sendNotification({
    token,
    data,
  }: {
    token: string;
    data: { title: string; body: string };
  }) {
    const message = {
      token,
      data,
    };
    return this.client.messaging().send(message);
  }

  async sendBulkNotification({
    tokens,
    data,
  }: {
    tokens: string[];
    data: { title: string; body: string };
  }) {
   await Promise.allSettled(
    tokens.map(token => {
      return this.sendNotification({token , data})
    })
   )
  }
}

export const notificationService = new NotificationService();
