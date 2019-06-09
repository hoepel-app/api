import * as admin from "firebase-admin";

export class UserService {
  constructor(
    private db: admin.firestore.Firestore,
    private auth: admin.auth.Auth,
  ) {}

  async acceptPrivacyPolicy(uid: string): Promise<void> {
    await this.db.collection('users').doc(uid).set({ acceptedPrivacyPolicy: new Date() }, { merge: true });
    return;
  }

  async acceptTermsAndConditions(uid: string): Promise<void> {
    await this.db.collection('users').doc(uid).set({ acceptedTermsAndConditions: new Date() }, { merge: true });
    return;
  }

  getUsers(maxResults?: number, pageToken?: string): Promise<admin.auth.ListUsersResult> {
    return this.auth.listUsers(maxResults, pageToken);
  }

  getUser(uid: string) {
    return this.auth.getUser(uid);
  }

  async updateDisplayName(uid: string, displayName: string): Promise<void> {
    // Update in Firestore
    await this.db.collection('users').doc(uid).set({ displayName: displayName }, { merge: true });

    // Update user property
    await this.auth.updateUser(uid, {
      displayName: displayName,
    });
  }
}
