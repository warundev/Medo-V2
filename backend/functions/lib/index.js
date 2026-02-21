"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMedicationReminders = exports.ping = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
exports.ping = functions.https.onRequest((req, res) => {
    res.status(200).json({ ok: true, timestamp: new Date().toISOString() });
});
/**
 * Scheduled function to send medication reminders
 * Runs every 6 hours to check for pending medications
 */
exports.sendMedicationReminders = functions.pubsub
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
                const isActive = durationDays === -1 || (todayDate >= startDate && todayDate <= endDate);
                if (!isActive)
                    continue;
                // Check if reminder already sent today
                const reminderSnapshot = await admin
                    .firestore()
                    .collection("users")
                    .doc(userId)
                    .collection("reminders")
                    .where("medicationId", "==", medDoc.id)
                    .where("date", "==", today)
                    .get();
                if (reminderSnapshot.size > 0)
                    continue;
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
                    }
                    catch (error) {
                        console.error(`Failed to send notification to user ${userId}:`, error);
                    }
                }
            }
        }
        console.log("Medication reminders job completed");
        return null;
    }
    catch (error) {
        console.error("Error in sendMedicationReminders:", error);
        return null;
    }
});
