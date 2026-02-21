import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

export const ping = functions.https.onRequest((req, res) => {
  res.status(200).json({ ok: true, timestamp: new Date().toISOString() });
});

/**
 * Scheduled function to send medication reminders
 * Runs every 6 hours to check for pending medications
 */
export const sendMedicationReminders = functions.pubsub
  .schedule("every 6 hours")
  .onRun(async (context) => {
    console.log("Starting medication reminders job at", context.timestamp);

    try {
      const usersSnapshot = await admin.firestore().collection("users").get();

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();

        // Get all medications for this user
        const medsSnapshot = await admin
          .firestore()
          .collection("users")
          .doc(userId)
          .collection("medications")
          .where("reminderEnabled", "==", true)
          .get();

        const today = new Date().toISOString().split("T")[0];

        for (const medDoc of medsSnapshot.docs) {
          const medication = medDoc.data();

          // Check if medication is active today
          const startDate = new Date(medication.startDate);
          const durationDays = parseInt(medication.duration.split(" ")[0]);
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + durationDays);

          const todayDate = new Date(today);
          const isActive =
            durationDays === -1 || (todayDate >= startDate && todayDate <= endDate);

          if (!isActive) continue;

          // Check if reminder already sent today
          const reminderSnapshot = await admin
            .firestore()
            .collection("users")
            .doc(userId)
            .collection("reminders")
            .where("medicationId", "==", medDoc.id)
            .where("date", "==", today)
            .get();

          if (reminderSnapshot.size > 0) continue;

          // Send notification if user has a push token
          if (userData.pushToken) {
            try {
              await admin.messaging().send({
                token: userData.pushToken,
                notification: {
                  title: "Take your medication",
                  body: `Don't forget to take ${medication.name} (${medication.dosage})`,
                },
                data: {
                  medicationId: medDoc.id,
                  medicationName: medication.name,
                  dosage: medication.dosage,
                },
              });

              // Record reminder as sent
              await admin
                .firestore()
                .collection("users")
                .doc(userId)
                .collection("reminders")
                .add({
                  medicationId: medDoc.id,
                  medicationName: medication.name,
                  date: today,
                  sentAt: admin.firestore.FieldValue.serverTimestamp(),
                  status: "sent",
                });

              console.log(`Reminder sent to user ${userId} for ${medication.name}`);
            } catch (error) {
              console.error(
                `Failed to send notification to user ${userId}:`,
                error
              );
            }
          }
        }
      }

      console.log("Medication reminders job completed");
      return null;
    } catch (error) {
      console.error("Error in sendMedicationReminders:", error);
      return null;
    }
  });

