import { db, auth } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

export interface FirestoreMedication {
  id?: string;
  userId: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  startDate: string;
  reminderEnabled: boolean;
  reminderTimes: string[];
  notes?: string;
  createdAt?: any;
}

export const addMedicationToFirestore = async (
  medication: Omit<FirestoreMedication, "userId" | "id">
) => {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error("User not authenticated");

  const docRef = await addDoc(collection(db, "users", userId, "medications"), {
    ...medication,
    userId,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getUserMedicationsFromFirestore = async () => {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error("User not authenticated");

  const q = query(collection(db, "users", userId, "medications"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as (FirestoreMedication & { id: string })[];
};

export const updateMedicationInFirestore = async (
  medicationId: string,
  updates: Partial<FirestoreMedication>
) => {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error("User not authenticated");

  const docRef = doc(db, "users", userId, "medications", medicationId);
  await updateDoc(docRef, updates);
};

export const deleteMedicationFromFirestore = async (medicationId: string) => {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error("User not authenticated");

  const docRef = doc(db, "users", userId, "medications", medicationId);
  await deleteDoc(docRef);
};

export interface FirestoreDoseHistory {
  medicationId: string;
  userId: string;
  taken: boolean;
  date: string;
  timestamp: any;
}

export const recordDoseToFirestore = async (
  medicationId: string,
  taken: boolean,
  timestamp: string
) => {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error("User not authenticated");

  const date = new Date(timestamp).toISOString().split("T")[0];
  await addDoc(collection(db, "users", userId, "doseHistory"), {
    medicationId,
    userId,
    taken,
    date,
    timestamp: serverTimestamp(),
  });
};

export const getDoseHistoryFromFirestore = async (date: string) => {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error("User not authenticated");

  const q = query(
    collection(db, "users", userId, "doseHistory"),
    where("date", "==", date)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as (FirestoreDoseHistory & { id: string })[];
};
