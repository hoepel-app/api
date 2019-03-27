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
}
