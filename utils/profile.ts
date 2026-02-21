import { db, auth } from "./firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

const PROFILE_COLLECTION = "userProfiles";
const HEALTH_DETAILS_COLLECTION = "healthDetails";

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  profileImage?: string;
  address: string;
  city: string;
  country: string;
  zipCode: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface HealthDetails {
  id: string;
  bloodType: string;
  height: number; // in cm
  weight: number; // in kg
  allergies: string[];
  medicalConditions: string[];
  surgeries: string[];
  currentMedications: string[];
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  doctor: string;
  doctorPhone: string;
  hospitalName: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  notes: string;
  createdAt?: any;
  updatedAt?: any;
}

export const defaultProfile: UserProfile = {
  id: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  gender: "",
  address: "",
  city: "",
  country: "",
  zipCode: "",
};

export const defaultHealthDetails: HealthDetails = {
  id: "",
  bloodType: "",
  height: 0,
  weight: 0,
  allergies: [],
  medicalConditions: [],
  surgeries: [],
  currentMedications: [],
  emergencyContactName: "",
  emergencyContactPhone: "",
  emergencyContactRelation: "",
  doctor: "",
  doctorPhone: "",
  hospitalName: "",
  insuranceProvider: "",
  insurancePolicyNumber: "",
  notes: "",
};

// Get current user ID
function getCurrentUserId(): string {
  const userId = auth.currentUser?.uid;
  if (!userId) {
    throw new Error("User not authenticated");
  }
  return userId;
}

// Profile Management
export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const userId = getCurrentUserId();
    const docRef = doc(db, PROFILE_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  try {
    const userId = getCurrentUserId();
    const docRef = doc(db, PROFILE_COLLECTION, userId);

    await setDoc(
      docRef,
      {
        ...profile,
        id: userId,
        updatedAt: serverTimestamp(),
        createdAt: profile.createdAt || serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Error saving user profile:", error);
    throw error;
  }
}

export async function updateUserProfile(
  updates: Partial<UserProfile>
): Promise<void> {
  try {
    const userId = getCurrentUserId();
    const docRef = doc(db, PROFILE_COLLECTION, userId);

    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
}

// Health Details Management
export async function getHealthDetails(): Promise<HealthDetails | null> {
  try {
    const userId = getCurrentUserId();
    const docRef = doc(db, HEALTH_DETAILS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as HealthDetails;
    }
    return null;
  } catch (error) {
    console.error("Error getting health details:", error);
    return null;
  }
}

export async function saveHealthDetails(details: HealthDetails): Promise<void> {
  try {
    const userId = getCurrentUserId();
    const docRef = doc(db, HEALTH_DETAILS_COLLECTION, userId);

    await setDoc(
      docRef,
      {
        ...details,
        id: userId,
        updatedAt: serverTimestamp(),
        createdAt: details.createdAt || serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Error saving health details:", error);
    throw error;
  }
}

export async function updateHealthDetails(
  updates: Partial<HealthDetails>
): Promise<void> {
  try {
    const userId = getCurrentUserId();
    const docRef = doc(db, HEALTH_DETAILS_COLLECTION, userId);

    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating health details:", error);
    throw error;
  }
}

// Helper functions
export function calculateBMI(height: number, weight: number): number {
  if (height === 0) return 0;
  return Math.round((weight / (height * height)) * 10000 * 10) / 10;
}

export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

export function getAge(dateOfBirth: string): number {
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}
