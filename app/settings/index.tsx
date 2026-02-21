import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  SafeAreaView,
  Image,
  Platform,
  Modal,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  UserProfile,
  HealthDetails,
  getUserProfile,
  getHealthDetails,
  saveUserProfile,
  saveHealthDetails,
  defaultProfile,
  defaultHealthDetails,
  calculateBMI,
  getBMICategory,
  getAge,
} from "../../utils/profile";
import { getCurrentUser } from "../../utils/auth";
import { getSavedTheme, saveTheme, getColors } from "../../utils/theme";

type Tab = "profile" | "health" | "general";

export default function SettingsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [healthDetails, setHealthDetails] =
    useState<HealthDetails>(defaultHealthDetails);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(
    profile.dateOfBirth ? new Date(profile.dateOfBirth) : new Date()
  );
  const [isDarkMode, setIsDarkMode] = useState(false);
  const colors = getColors(isDarkMode ? "dark" : "light");

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const pickImageFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        setProfileImageUri(result.assets[0].uri);
        setProfile({
          ...profile,
          profileImage: result.assets[0].uri,
        });
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const pickImageFromCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        setProfileImageUri(result.assets[0].uri);
        setProfile({
          ...profile,
          profileImage: result.assets[0].uri,
        });
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo");
    }
  };

  const handleChangeProfilePicture = () => {
    Alert.alert(
      "Change Profile Picture",
      "Choose a photo source",
      [
        {
          text: "Camera",
          onPress: pickImageFromCamera,
        },
        {
          text: "Gallery",
          onPress: pickImageFromLibrary,
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    
    if (date) {
      setSelectedDate(date);
      const formattedDate = date.toISOString().split("T")[0];
      setProfile({ ...profile, dateOfBirth: formattedDate });
    }
  };

  const formatDateDisplay = (dateString: string): string => {
    if (!dateString) return "Select Date";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const userProfile = await getUserProfile();
      const health = await getHealthDetails();
      const currentUser = getCurrentUser();
      const savedTheme = await getSavedTheme();

      if (userProfile) {
        setProfile(userProfile);
        if (userProfile.profileImage) {
          setProfileImageUri(userProfile.profileImage);
        }
      } else {
        // Initialize with current user email
        setProfile({
          ...defaultProfile,
          id: currentUser?.uid || "",
          email: currentUser?.email || "",
        });
      }

      if (health) {
        setHealthDetails(health);
      } else {
        setHealthDetails({
          ...defaultHealthDetails,
          id: currentUser?.uid || "",
        });
      }

      setIsDarkMode(savedTheme === "dark");
    } catch (error) {
      console.error("Error loading profile:", error);
      Alert.alert("Error", "Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      if (!profile.firstName || !profile.lastName) {
        Alert.alert("Validation", "Please enter first and last name");
        return;
      }

      setSaving(true);
      await saveUserProfile(profile);
      Alert.alert("Success", "Profile updated successfully");
    } catch (error) {
      console.error("Error saving profile:", error);
      Alert.alert("Error", "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHealthDetails = async () => {
    try {
      setSaving(true);
      await saveHealthDetails(healthDetails);
      Alert.alert("Success", "Health details updated successfully");
    } catch (error) {
      console.error("Error saving health details:", error);
      Alert.alert("Error", "Failed to save health details");
    } finally {
      setSaving(false);
    }
  };

  const renderProfileTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.profilePictureSection}>
        <View style={styles.profilePictureContainer}>
          {profileImageUri ? (
            <Image
              source={{ uri: profileImageUri }}
              style={styles.profilePicture}
            />
          ) : (
            <View style={styles.profilePicturePlaceholder}>
              <Ionicons name="person" size={60} color="#ccc" />
            </View>
          )}
          <TouchableOpacity
            style={styles.changePictureButton}
            onPress={handleChangeProfilePicture}
          >
            <Ionicons name="camera" size={16} color="white" />
          </TouchableOpacity>
        </View>
        <Text style={styles.profileName}>
          {profile.firstName || "First Name"} {profile.lastName || "Last Name"}
        </Text>
        <Text style={styles.profileEmail}>{profile.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>First Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter first name"
            value={profile.firstName}
            onChangeText={(text) =>
              setProfile({ ...profile, firstName: text })
            }
            editable={!saving}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter last name"
            value={profile.lastName}
            onChangeText={(text) =>
              setProfile({ ...profile, lastName: text })
            }
            editable={!saving}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            placeholder="Email"
            value={profile.email}
            editable={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter phone number"
            value={profile.phone}
            onChangeText={(text) =>
              setProfile({ ...profile, phone: text })
            }
            keyboardType="phone-pad"
            editable={!saving}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date of Birth</Text>
          <TouchableOpacity
            style={[styles.input, styles.datePickerButton]}
            onPress={() => setShowDatePicker(true)}
            disabled={saving}
          >
            <Ionicons name="calendar" size={20} color="#0071E3" />
            <Text style={styles.datePickerText}>
              {profile.dateOfBirth
                ? formatDateDisplay(profile.dateOfBirth)
                : "Select Date of Birth"}
            </Text>
          </TouchableOpacity>
          {profile.dateOfBirth && (
            <Text style={styles.infoText}>
              Age: {getAge(profile.dateOfBirth)} years
            </Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.genderContainer}>
            {["Male", "Female", "Other"].map((gender) => (
              <TouchableOpacity
                key={gender}
                style={[
                  styles.genderButton,
                  profile.gender === gender && styles.genderButtonActive,
                ]}
                onPress={() => setProfile({ ...profile, gender })}
                disabled={saving}
              >
                <Text
                  style={[
                    styles.genderButtonText,
                    profile.gender === gender &&
                      styles.genderButtonTextActive,
                  ]}
                >
                  {gender}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Address</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Street address"
            value={profile.address}
            onChangeText={(text) =>
              setProfile({ ...profile, address: text })
            }
            editable={!saving}
          />
        </View>

        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              placeholder="City"
              value={profile.city}
              onChangeText={(text) =>
                setProfile({ ...profile, city: text })
              }
              editable={!saving}
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Zip Code</Text>
            <TextInput
              style={styles.input}
              placeholder="Zip code"
              value={profile.zipCode}
              onChangeText={(text) =>
                setProfile({ ...profile, zipCode: text })
              }
              editable={!saving}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Country</Text>
          <TextInput
            style={styles.input}
            placeholder="Country"
            value={profile.country}
            onChangeText={(text) =>
              setProfile({ ...profile, country: text })
            }
            editable={!saving}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSaveProfile}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? "Saving..." : "Save Profile"}
        </Text>
      </TouchableOpacity>
      
      {showDatePicker && (
        Platform.OS === "ios" ? (
          <Modal
            transparent
            animationType="slide"
            visible={showDatePicker}
            onRequestClose={() => setShowDatePicker(false)}
          >
            <View style={styles.datePickerModal}>
              <View style={styles.datePickerContainer}>
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Text style={styles.datePickerCancel}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={styles.datePickerTitle}>Select Date</Text>
                  <TouchableOpacity onPress={() => {
                    const formattedDate = selectedDate.toISOString().split("T")[0];
                    setProfile({ ...profile, dateOfBirth: formattedDate });
                    setShowDatePicker(false);
                  }}>
                    <Text style={styles.datePickerDone}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  textColor="#0071E3"
                />
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )
      )}
    </ScrollView>
  );

  const renderHealthTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Health Information</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Blood Type</Text>
          <View style={styles.bloodTypeContainer}>
            {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.bloodTypeButton,
                  healthDetails.bloodType === type &&
                    styles.bloodTypeButtonActive,
                ]}
                onPress={() =>
                  setHealthDetails({ ...healthDetails, bloodType: type })
                }
                disabled={saving}
              >
                <Text
                  style={[
                    styles.bloodTypeButtonText,
                    healthDetails.bloodType === type &&
                      styles.bloodTypeButtonTextActive,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Height (cm)</Text>
            <TextInput
              style={styles.input}
              placeholder="Height"
              value={String(healthDetails.height)}
              onChangeText={(text) =>
                setHealthDetails({
                  ...healthDetails,
                  height: parseInt(text) || 0,
                })
              }
              keyboardType="number-pad"
              editable={!saving}
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput
              style={styles.input}
              placeholder="Weight"
              value={String(healthDetails.weight)}
              onChangeText={(text) =>
                setHealthDetails({
                  ...healthDetails,
                  weight: parseInt(text) || 0,
                })
              }
              keyboardType="number-pad"
              editable={!saving}
            />
          </View>
        </View>

        {healthDetails.height > 0 && healthDetails.weight > 0 && (
          <View style={styles.bmiCard}>
            <Text style={styles.bmiLabel}>BMI</Text>
            <Text style={styles.bmiValue}>
              {calculateBMI(healthDetails.height, healthDetails.weight).toFixed(
                1
              )}
            </Text>
            <Text style={styles.bmiCategory}>
              {getBMICategory(
                calculateBMI(healthDetails.height, healthDetails.weight)
              )}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Medical History</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Allergies (comma separated)</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="e.g., Penicillin, Peanuts"
            value={healthDetails.allergies.join(", ")}
            onChangeText={(text) =>
              setHealthDetails({
                ...healthDetails,
                allergies: text
                  .split(",")
                  .map((item) => item.trim())
                  .filter((item) => item),
              })
            }
            multiline
            editable={!saving}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Medical Conditions (comma separated)
          </Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="e.g., Diabetes, Hypertension"
            value={healthDetails.medicalConditions.join(", ")}
            onChangeText={(text) =>
              setHealthDetails({
                ...healthDetails,
                medicalConditions: text
                  .split(",")
                  .map((item) => item.trim())
                  .filter((item) => item),
              })
            }
            multiline
            editable={!saving}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Previous Surgeries (comma separated)</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="e.g., Appendectomy"
            value={healthDetails.surgeries.join(", ")}
            onChangeText={(text) =>
              setHealthDetails({
                ...healthDetails,
                surgeries: text
                  .split(",")
                  .map((item) => item.trim())
                  .filter((item) => item),
              })
            }
            multiline
            editable={!saving}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency Contact</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Emergency Contact Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Name"
            value={healthDetails.emergencyContactName}
            onChangeText={(text) =>
              setHealthDetails({
                ...healthDetails,
                emergencyContactName: text,
              })
            }
            editable={!saving}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Emergency Contact Phone</Text>
          <TextInput
            style={styles.input}
            placeholder="Phone number"
            value={healthDetails.emergencyContactPhone}
            onChangeText={(text) =>
              setHealthDetails({
                ...healthDetails,
                emergencyContactPhone: text,
              })
            }
            keyboardType="phone-pad"
            editable={!saving}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Relation to Contact</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Spouse, Parent"
            value={healthDetails.emergencyContactRelation}
            onChangeText={(text) =>
              setHealthDetails({
                ...healthDetails,
                emergencyContactRelation: text,
              })
            }
            editable={!saving}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Healthcare Provider</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Doctor Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Doctor's name"
            value={healthDetails.doctor}
            onChangeText={(text) =>
              setHealthDetails({
                ...healthDetails,
                doctor: text,
              })
            }
            editable={!saving}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Doctor Phone</Text>
          <TextInput
            style={styles.input}
            placeholder="Doctor's phone"
            value={healthDetails.doctorPhone}
            onChangeText={(text) =>
              setHealthDetails({
                ...healthDetails,
                doctorPhone: text,
              })
            }
            keyboardType="phone-pad"
            editable={!saving}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Hospital/Clinic Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Hospital name"
            value={healthDetails.hospitalName}
            onChangeText={(text) =>
              setHealthDetails({
                ...healthDetails,
                hospitalName: text,
              })
            }
            editable={!saving}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Insurance Provider</Text>
          <TextInput
            style={styles.input}
            placeholder="Insurance provider"
            value={healthDetails.insuranceProvider}
            onChangeText={(text) =>
              setHealthDetails({
                ...healthDetails,
                insuranceProvider: text,
              })
            }
            editable={!saving}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Insurance Policy Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Policy number"
            value={healthDetails.insurancePolicyNumber}
            onChangeText={(text) =>
              setHealthDetails({
                ...healthDetails,
                insurancePolicyNumber: text,
              })
            }
            editable={!saving}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Additional Notes</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Any other health-related notes"
            value={healthDetails.notes}
            onChangeText={(text) =>
              setHealthDetails({
                ...healthDetails,
                notes: text,
              })
            }
            multiline
            editable={!saving}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSaveHealthDetails}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? "Saving..." : "Save Health Details"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderGeneralTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Settings</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingItemLeft}>
            <Ionicons 
              name={isDarkMode ? "moon" : "sunny"} 
              size={24} 
              color="#0071E3" 
            />
            <View style={styles.settingItemText}>
              <Text style={styles.settingItemTitle}>Dark Mode</Text>
              <Text style={styles.settingItemDesc}>
                {isDarkMode ? "Enabled" : "Disabled"}
              </Text>
            </View>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={async (value) => {
              setIsDarkMode(value);
              await saveTheme(value ? "dark" : "light");
            }}
            trackColor={{ false: "#ccc", true: "#0071E3" }}
            thumbColor={isDarkMode ? "#0071E3" : "#fff"}
          />
        </View>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingItemLeft}>
            <Ionicons name="notifications" size={24} color="#0071E3" />
            <View style={styles.settingItemText}>
              <Text style={styles.settingItemTitle}>Notifications</Text>
              <Text style={styles.settingItemDesc}>
                Manage notification preferences
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingItemLeft}>
            <Ionicons name="lock-closed" size={24} color="#0071E3" />
            <View style={styles.settingItemText}>
              <Text style={styles.settingItemTitle}>Biometric Login</Text>
              <Text style={styles.settingItemDesc}>Use Face ID or Touch ID</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingItemLeft}>
            <Ionicons name="document-text" size={24} color="#0071E3" />
            <View style={styles.settingItemText}>
              <Text style={styles.settingItemTitle}>Privacy Policy</Text>
              <Text style={styles.settingItemDesc}>View privacy terms</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingItemLeft}>
            <Ionicons name="information-circle" size={24} color="#0071E3" />
            <View style={styles.settingItemText}>
              <Text style={styles.settingItemTitle}>About</Text>
              <Text style={styles.settingItemDesc}>App version and info</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#999" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={["#0071E3", "#2997FF"]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 28 }} />
        </View>
      </LinearGradient>

      <View style={[styles.tabsContainer, { backgroundColor: colors.surface }]}>
        {(["profile", "health", "general"] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                { color: colors.text },
                activeTab === tab && styles.activeTabText,
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={{ backgroundColor: colors.background }}>
        {activeTab === "profile" && renderProfileTab()}
        {activeTab === "health" && renderHealthTab()}
        {activeTab === "general" && renderGeneralTab()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "white",
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#0071E3",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#999",
  },
  activeTabText: {
    color: "#0071E3",
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
    color: "#333",
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputRow: {
    flexDirection: "row",
    marginBottom: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#333",
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  disabledInput: {
    backgroundColor: "#f5f5f5",
    color: "#999",
  },
  infoText: {
    fontSize: 12,
    color: "#0071E3",
    marginTop: 4,
  },
  genderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  genderButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    alignItems: "center",
  },
  genderButtonActive: {
    backgroundColor: "#0071E3",
    borderColor: "#0071E3",
  },
  genderButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#666",
  },
  genderButtonTextActive: {
    color: "white",
  },
  bloodTypeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  bloodTypeButton: {
    width: "23%",
    paddingVertical: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    alignItems: "center",
  },
  bloodTypeButtonActive: {
    backgroundColor: "#0071E3",
    borderColor: "#0071E3",
  },
  bloodTypeButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#666",
  },
  bloodTypeButtonTextActive: {
    color: "white",
  },
  bmiCard: {
    backgroundColor: "#f0f8ff",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  bmiLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  bmiValue: {
    fontSize: 28,
    fontWeight: "600",
    color: "#0071E3",
  },
  bmiCategory: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: "#0071E3",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingItemText: {
    marginLeft: 12,
    flex: 1,
  },
  settingItemTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 2,
  },
  settingItemDesc: {
    fontSize: 12,
    color: "#999",
  },
  profilePictureSection: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    alignItems: "center",
  },
  profilePictureContainer: {
    position: "relative",
    marginBottom: 16,
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#e0e0e0",
  },
  profilePicturePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  changePictureButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#0071E3",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "white",
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: "#666",
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    justifyContent: "flex-start",
    gap: 10,
  },
  datePickerText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  datePickerModal: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  datePickerContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  datePickerCancel: {
    fontSize: 14,
    color: "#999",
    fontWeight: "500",
  },
  datePickerDone: {
    fontSize: 14,
    color: "#0071E3",
    fontWeight: "600",
  },
});

