import Constants from "expo-constants";
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

type FirebaseConfig = {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
};

const extra = (Constants.expoConfig?.extra ?? Constants.manifest?.extra ?? {}) as {
  firebase?: FirebaseConfig;
};

const firebaseConfig = extra.firebase ?? {};

if (!firebaseConfig.apiKey) {
  console.warn("Firebase config is missing. Check your .env values.");
}

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
