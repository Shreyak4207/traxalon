import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } else {
    try {
      const { createRequire } = await import("module");
      const require = createRequire(import.meta.url);
      const serviceAccount = require("./serviceAccountKey.json");
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    } catch {
      throw new Error(
        "Firebase Admin credentials missing.\n" +
        "Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env\n" +
        "OR place serviceAccountKey.json in backend/firebase/"
      );
    }
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
export default admin;
