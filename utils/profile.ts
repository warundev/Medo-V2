import AsyncStorage from "@react-native-async-storage/async-storage";

const PROFILE_KEY = "@user_profile";
const HEALTH_DETAILS_KEY = "@health_details";

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

// Profile Management
export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const data = await AsyncStorage.getItem(PROFILE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error("Error saving user profile:", error);
    throw error;
  }
}

export async function updateUserProfile(
  updates: Partial<UserProfile>
): Promise<void> {
  try {
    const profile = await getUserProfile();
    const updated = { ...profile, ...updates };
    await saveUserProfile(updated as UserProfile);
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
}

// Health Details Management
export async function getHealthDetails(): Promise<HealthDetails | null> {
  try {
    const data = await AsyncStorage.getItem(HEALTH_DETAILS_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error getting health details:", error);
    return null;
  }
}

export async function saveHealthDetails(details: HealthDetails): Promise<void> {
  try {
    await AsyncStorage.setItem(HEALTH_DETAILS_KEY, JSON.stringify(details));
  } catch (error) {
    console.error("Error saving health details:", error);
    throw error;
  }
}

export async function updateHealthDetails(
  updates: Partial<HealthDetails>
): Promise<void> {
  try {
    const details = await getHealthDetails();
    const updated = { ...details, ...updates };
    await saveHealthDetails(updated as HealthDetails);
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
