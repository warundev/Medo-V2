import { db, auth } from "./firebase";
import {
  doc,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

const MEDICATIONS_COLLECTION = "medications";
const DOSE_HISTORY_COLLECTION = "doseHistory";

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  times: string[];
  startDate: string;
  duration: string;
  color: string;
  reminderEnabled: boolean;
  currentSupply: number;
  totalSupply: number;
  refillAt: number;
  refillReminder: boolean;
  lastRefillDate?: string;
  userId?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface DoseHistory {
  id: string;
  medicationId: string;
  timestamp: string;
  taken: boolean;
  userId?: string;
  createdAt?: any;
}

// Get current user ID
function getCurrentUserId(): string {
  const userId = auth.currentUser?.uid;
  if (!userId) {
    throw new Error("User not authenticated");
  }
  return userId;
}

export async function getMedications(): Promise<Medication[]> {
  try {
    const userId = getCurrentUserId();
    const q = query(
      collection(db, MEDICATIONS_COLLECTION),
      where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(q);
    const medications: Medication[] = [];
    querySnapshot.forEach((doc) => {
      medications.push({
        id: doc.id,
        ...doc.data(),
      } as Medication);
    });
    return medications;
  } catch (error) {
    console.error("Error getting medications:", error);
    return [];
  }
}

export async function addMedication(medication: Medication): Promise<void> {
  try {
    const userId = getCurrentUserId();
    await addDoc(collection(db, MEDICATIONS_COLLECTION), {
      ...medication,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error adding medication:", error);
    throw error;
  }
}

export async function updateMedication(
  updatedMedication: Medication
): Promise<void> {
  try {
    const userId = getCurrentUserId();
    const docRef = doc(db, MEDICATIONS_COLLECTION, updatedMedication.id);
    await updateDoc(docRef, {
      ...updatedMedication,
      userId,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating medication:", error);
    throw error;
  }
}

export async function deleteMedication(id: string): Promise<void> {
  try {
    const docRef = doc(db, MEDICATIONS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting medication:", error);
    throw error;
  }
}

export async function getDoseHistory(): Promise<DoseHistory[]> {
  try {
    const userId = getCurrentUserId();
    const q = query(
      collection(db, DOSE_HISTORY_COLLECTION),
      where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(q);
    const history: DoseHistory[] = [];
    querySnapshot.forEach((doc) => {
      history.push({
        id: doc.id,
        ...doc.data(),
      } as DoseHistory);
    });
    return history;
  } catch (error) {
    console.error("Error getting dose history:", error);
    return [];
  }
}

export async function getTodaysDoses(): Promise<DoseHistory[]> {
  try {
    const history = await getDoseHistory();
    const today = new Date().toDateString();
    return history.filter(
      (dose) => new Date(dose.timestamp).toDateString() === today
    );
  } catch (error) {
    console.error("Error getting today's doses:", error);
    return [];
  }
}

export async function recordDose(
  medicationId: string,
  taken: boolean,
  timestamp: string
): Promise<void> {
  try {
    const userId = getCurrentUserId();
    await addDoc(collection(db, DOSE_HISTORY_COLLECTION), {
      medicationId,
      timestamp,
      taken,
      userId,
      createdAt: serverTimestamp(),
    });

    // Update medication supply if taken
    if (taken) {
      const medications = await getMedications();
      const medication = medications.find((med) => med.id === medicationId);
      if (medication && medication.currentSupply > 0) {
        medication.currentSupply -= 1;
        await updateMedication(medication);
      }
      
      // Re-schedule notification after dose is taken to ensure it continues tomorrow
      if (medication && medication.reminderEnabled) {
        const { updateMedicationReminders } = await import("./notifications");
        try {
          await updateMedicationReminders(medication);
        } catch (error) {
          console.error("Error updating reminder after dose:", error);
        }
      }
    }
  } catch (error) {
    console.error("Error recording dose:", error);
    throw error;
  }
}

export async function clearAllData(): Promise<void> {
  try {
    const userId = getCurrentUserId();
    
    // Delete medications
    const medicationsQ = query(
      collection(db, MEDICATIONS_COLLECTION),
      where("userId", "==", userId)
    );
    const medicationsSnapshot = await getDocs(medicationsQ);
    for (const doc of medicationsSnapshot.docs) {
      await deleteDoc(doc.ref);
    }

    // Delete dose history
    const historyQ = query(
      collection(db, DOSE_HISTORY_COLLECTION),
      where("userId", "==", userId)
    );
    const historySnapshot = await getDocs(historyQ);
    for (const doc of historySnapshot.docs) {
      await deleteDoc(doc.ref);
    }
  } catch (error) {
    console.error("Error clearing data:", error);
    throw error;
  }}