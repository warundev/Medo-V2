import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { Medication } from "./storage";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Helper function to calculate seconds until next reminder time
function getSecondsUntilReminder(hour: number, minute: number): number {
  const now = new Date();
  let reminderTime = new Date();
  reminderTime.setHours(hour, minute, 0, 0);

  // If the time has already passed today, schedule for tomorrow
  if (reminderTime <= now) {
    reminderTime.setDate(reminderTime.getDate() + 1);
  }

  const seconds = Math.floor((reminderTime.getTime() - now.getTime()) / 1000);
  
  // Ensure we have a valid interval - minimum 60 seconds, maximum 86400 (24 hours)
  if (seconds <= 0) {
    // If somehow still in the past, add a day
    return 86400;
  }
  
  return Math.min(seconds, 86400); // Cap at 24 hours
}

export async function registerForPushNotificationsAsync(): Promise<
  string | null
> {
  let token: string | null = null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  try {
    const response = await Notifications.getExpoPushTokenAsync({
      projectId: "f5031467-5e7c-4ae5-888a-2a6c6083647f",
    });
    token = response.data;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#0071E3",
      });

      // Create medication reminder channel
      await Notifications.setNotificationChannelAsync("medication-reminders", {
        name: "Medication Reminders",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF6B6B",
        bypassDnd: true,
      });
    }

    return token;
  } catch (error) {
    console.error("Error getting push token:", error);
    return null;
  }
}

export async function scheduleMedicationReminder(
  medication: Medication
): Promise<string | undefined> {
  if (!medication.reminderEnabled) return;

  try {
    // Cancel any existing reminders for this medication first
    await cancelMedicationReminders(medication.id);

    // Schedule notifications for each time
    let lastIdentifier: string | undefined;
    for (const time of medication.times) {
      const [hours, minutes] = time.split(":").map(Number);
      const secondsUntilReminder = getSecondsUntilReminder(hours, minutes);
      
      // Use 24 hours (86400 seconds) as the repeat interval for daily notifications
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: `💊 ${medication.name}`,
          body: `Take ${medication.dosage} - Time: ${time}`,
          data: { 
            medicationId: medication.id, 
            type: "medication",
            hour: hours,
            minute: minutes,
          },
          sound: true,
          badge: 1,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: Math.max(secondsUntilReminder, 60), // Minimum 60 seconds, maximum 86400 for next day
          repeats: true,
        },
      });

      console.log(`Scheduled daily reminder for ${medication.name} at ${time} (first in ${secondsUntilReminder}s, repeats every 86400s): ${identifier}`);
      lastIdentifier = identifier;
    }
    return lastIdentifier;
  } catch (error) {
    console.error("Error scheduling medication reminder:", error);
    return undefined;
  }
}

export async function scheduleRefillReminder(
  medication: Medication
): Promise<string | undefined> {
  if (!medication.refillReminder) return;

  try {
    // Schedule a notification when supply is low
    if (medication.currentSupply <= medication.refillAt) {
      const secondsUntilReminder = getSecondsUntilReminder(9, 0); // 9 AM daily
      
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: "🔄 Refill Reminder",
          body: `Your ${medication.name} supply is running low. Current supply: ${medication.currentSupply}`,
          data: { 
            medicationId: medication.id, 
            type: "refill",
          },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: secondsUntilReminder,
          repeats: true,
        },
      });

      console.log(`Scheduled refill reminder for ${medication.name} (${secondsUntilReminder}s): ${identifier}`);
      return identifier;
    }
  } catch (error) {
    console.error("Error scheduling refill reminder:", error);
    return undefined;
  }
}

export async function cancelMedicationReminders(
  medicationId: string
): Promise<void> {
  try {
    const scheduledNotifications =
      await Notifications.getAllScheduledNotificationsAsync();

    console.log(`Found ${scheduledNotifications.length} scheduled notifications`);

    for (const notification of scheduledNotifications) {
      const data = notification.content.data as {
        medicationId?: string;
      } | null;
      if (data?.medicationId === medicationId) {
        await Notifications.cancelScheduledNotificationAsync(
          notification.identifier
        );
        console.log(`Cancelled notification: ${notification.identifier}`);
      }
    }
  } catch (error) {
    console.error("Error canceling medication reminders:", error);
  }
}

export async function updateMedicationReminders(
  medication: Medication
): Promise<void> {
  try {
    // Cancel existing reminders
    await cancelMedicationReminders(medication.id);

    // Schedule new reminders
    await scheduleMedicationReminder(medication);
    await scheduleRefillReminder(medication);
  } catch (error) {
    console.error("Error updating medication reminders:", error);
  }
}
