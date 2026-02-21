# 💊 Medo V2 – Your Smart Medicine Minder

A comprehensive React Native app built with Expo to help users manage their medication schedules, track refills, monitor daily progress, and get AI-powered health insights — all while ensuring secure and smooth user experience.

---

## 📱 App Features

### 💊 Medication Management
- 🔔 **Smart Daily Reminders** - Precise time-based notifications that repeat daily
- 📋 **Medication Tracking** - Record which doses you've taken or missed
- 💾 **Supply Management** - Track current stock and receive refill alerts
- 📊 **History Logging** - Detailed dose history with date, time, and status

### 🏥 AI Healthcare Assistant (MedBot)
- 🤖 **Intelligent Health Analysis** - Ask questions about symptoms and conditions
- 📸 **Image-Based Diagnosis Help** - Capture photos of skin conditions or injuries for AI analysis
- 💊 **Medicine Recommendations** - Get OTC medicine suggestions with dosage info
- 🏠 **Home Remedy Suggestions** - Eco-friendly wellness tips
- ⚠️ **Safety Warnings** - Clear disclaimers about when to see a doctor

### 👤 User Profile & Health Management
- 📝 **Complete Profile Setup** - First name, last name, email, phone, address
- 📅 **Date of Birth Picker** - Native date selection for iOS and Android
- 🖼️ **Profile Picture Upload** - Camera or gallery image selection
- ♀️ **Gender & Demographics** - Complete personal information
- 🩺 **Health Details Tracking**:
  - Blood type management
  - Height/Weight with automatic BMI calculation
  - Medical allergies
  - Past conditions & surgeries
  - Emergency contacts
  - Healthcare provider information

### 📊 Dashboard & Tracking
- 📈 **Daily Progress Ring** - Visual indicator of medication adherence
- 🗓️ **Calendar View** - Plan and track medication intake
- 📜 **History Log** - Filter by "Taken", "Missed", or "All" doses
- 📱 **Quick Actions** - Mark doses as taken with one tap

### 🌙 User Experience
- 🎨 **Dark Mode** - Toggle dark/light theme in settings (saves preference)
- 🔐 **Firebase Authentication** - Secure email/password login and signup
- 👥 **Multi-User Support** - Each user has isolated, secure data
- 🔒 **Firestore Security** - User-scoped data access with backend rules
- 💾 **Cloud Sync** - All data synced to Firebase Firestore

### 🛠️ Advanced Features
- 🔄 **Refill Reminders** - Daily alerts when supply runs low
- 🎯 **Medication Duration** - Set duration (7, 14, 30, 90 days, or ongoing)
- 🎨 **Color-Coded Meds** - Each medication gets a unique color
- 📲 **Push Notifications** - Background reminders even when app is closed
- 🔄 **Auto-Refresh** - Notifications re-schedule after dose recorded

---

## 🛠️ Tech Stack

| Technology | Usage |
|-----------|-------|
| [React Native](https://reactnative.dev/) | Cross-platform mobile framework |
| [Expo](https://expo.dev/) | App build & deployment tooling |
| [TypeScript](https://www.typescriptlang.org/) | Strong typing for code safety |
| [Expo Router](https://expo.dev/router) | File-based routing |
| [Firebase Auth](https://firebase.google.com/docs/auth) | User authentication |
| [Firestore](https://firebase.google.com/docs/firestore) | Real-time cloud database |
| [Firebase Functions](https://firebase.google.com/docs/functions) | Serverless backend |
| [Expo Notifications](https://docs.expo.dev/sdk/notifications/) | Local & push notifications |
| [OpenAI Vision API](https://openai.com/vision/) | Image analysis for health insights |
| [Expo Image Picker](https://docs.expo.dev/sdk/imagepicker/) | Camera & gallery access |
| [React Native DateTimePicker](https://github.com/react-native-datetimepicker/datetimepicker) | Date selection |
| [LinearGradient](https://docs.expo.dev/sdk/linear-gradient/) | UI styling |
| [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) | Theme persistence |

---

## 📋 Data Structure

### Firestore Collections:
- **users** - User accounts and authentication data
- **userProfiles** - User profile information
- **healthDetails** - Health metrics and medical history
- **medications** - Active medication records
- **doseHistory** - Daily dose tracking logs
- **refillReminders** - Refill notification history

### Security:
- ✅ User-scoped data access (userId filtering)
- ✅ Firebase security rules for CRUD operations
- ✅ Read/Write/Delete permissions per user
- ✅ Server-side timestamp validation

---

## 🚀 Getting Started

### Prerequisites
- Node.js & npm
- Expo CLI: `npm install -g expo-cli`
- Firebase CLI: `npm install -g firebase-tools`
- OpenAI API Key (for MedBot)

### 1. Clone & Install

```bash
git clone https://github.com/your-username/medo
cd medo
npm install
```

### 2. Configure Firebase

```bash
# Create .env file
EXPO_PUBLIC_FIREBASE_API_KEY=your_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_key
```

### 3. Run the App

```bash
npx expo start
```

Press `i` for iOS or `a` for Android

---

## 🏗️ Architecture

```
medo-v2/
├── app/                      # Screen components
│   ├── _layout.tsx          # Root layout with ThemeProvider
│   ├── index.tsx            # Splash screen
│   ├── auth.tsx             # Login/Signup
│   ├── home.tsx             # Dashboard
│   ├── chat.tsx             # MedBot chatbot
│   ├── calendar/            # Calendar view
│   ├── history/             # Dose history
│   ├── medications/add.tsx   # Add medication
│   ├── refills/             # Refill tracking
│   ├── findcare/            # Find healthcare
│   └── settings/            # Profile & settings
├── utils/                    # Utility functions
│   ├── firebase.ts          # Firebase config
│   ├── storage.ts           # Firestore medication data
│   ├── profile.ts           # User profile management
│   ├── notifications.ts     # Reminder scheduling
│   ├── openai.ts            # MedBot API
│   ├── theme.ts             # Dark mode colors
│   └── auth.ts              # Auth utilities
├── contexts/                # React Context
│   └── ThemeContext.tsx     # Global theme provider
├── components/              # Reusable components
├── constants/               # App constants
├── assets/                  # Images, fonts
└── backend/                 # Firebase backend
    ├── firestore.rules      # Security rules
    ├── firestore.indexes.json
    └── functions/           # Cloud functions
```

---

## 🔔 Notification System

- ⏰ **Daily Reminders**: Scheduled at exact medication times
- 🔄 **Auto-Refresh**: Reminders persist even after recording doses
- 🔊 **Sound & Badge**: Audio alerts with app badge count
- 📲 **Background Notifications**: Works when app is closed
- ♻️ **Auto-Reschedule**: Continues daily after dose recorded

---

## 🚢 Deploying

### Deploy Mobile App Builds (Expo EAS)

1. Install EAS CLI (if not installed):

```bash
npm install -g eas-cli
```

2. Login to Expo:

```bash
eas login
```

3. Configure EAS once in the project root (if needed):

```bash
eas build:configure
```

4. Build app binaries:

```bash
# Android
eas build -p android --profile production

# iOS
eas build -p ios --profile production
```

5. Submit builds to stores (optional):

```bash
# Android (Google Play)
eas submit -p android

# iOS (App Store Connect)
eas submit -p ios
```

### Deploy Firebase Cloud Functions

From the `backend/functions` folder:

```bash
npm install
npm run build
```

Then from the `backend` folder:

```bash
firebase login
firebase deploy --only functions
```

### Useful Checks Before Deploy

- Update app version and build numbers in `app.json` / `app.config.js`
- Confirm environment variables and Firebase project settings are correct
- Test locally with `npx expo start` and Firebase emulators before production deploy

---

## 🐛 Troubleshooting & Common Issues

### Notifications Not Appearing

**Issue**: Set reminders but notifications don't show
- ✅ Check if notifications are enabled for the app in device settings
- ✅ Verify time zone changes (reminders calculate based on device time)
- ✅ Ensure `setupNotifications()` runs on app startup in `home.tsx`
- ✅ Check `utils/notifications.ts` logs to confirm reminder scheduling
- **Solution**: Restart app to trigger `useFocusEffect` which refreshes notifications

### OpenAI API Errors

**Issue**: MedBot returns "Error: API Request Failed"
- ✅ Verify `EXPO_PUBLIC_OPENAI_API_KEY` is set in `.env`
- ✅ Check API quota and billing status on OpenAI dashboard
- ✅ Ensure image size < 20MB (resized in `chat.tsx`)
- ✅ Verify API key has Vision API permissions (gpt-4o-mini)
- **Solution**: Check application logs with `npx expo start` and look for exact API error

### Camera/Photo Permissions Denied

**Issue**: "Camera permission denied" or "Photo library access denied"
- ✅ Check `app.json` has correct permission descriptions
- ✅ iOS: Go to Settings → Privacy → Camera/Photos
- ✅ Android: Settings → Apps → Medo → Permissions
- ✅ Verify `ImagePicker.requestCameraPermissionsAsync()` is called
- **Solution**: Uninstall app and reinstall, system will prompt for permissions again

### Firebase Authentication Issues

**Issue**: "FirebaseError: Invalid API Key" or "Project not configured"
- ✅ Verify all Firebase env variables are correctly set in `.env`
- ✅ Check Firebase project ID matches in Firebase console
- ✅ Ensure "Email/Password" auth provider is enabled in Firebase
- ✅ Confirm Firestore database is created and running
- **Solution**: Regenerate Firebase service account key and update env variables

### Firestore Permission Errors

**Issue**: "FirebaseError: Missing or insufficient permissions"
- ✅ Verify `firestore.rules` is properly deployed:
  ```bash
  firebase login
  firebase deploy --only firestore:rules
  ```
- ✅ Check that `userId` field is set in all documents
- ✅ Verify user is authenticated before any Firestore calls
- ✅ Check browser console for exact error (which collection/operation)
- **Solution**: Update rules and redeploy; verify userId matches request.auth.uid

### Theme Not Persisting

**Issue**: Dark mode reverts to light on app restart
- ✅ Verify `saveTheme()` is called on toggle in `settings/index.tsx`
- ✅ Check AsyncStorage is properly initialized
- ✅ Ensure `ThemeProvider` is wrapped in `app/_layout.tsx`
- ✅ Check that `getSavedTheme()` completes before rendering
- **Solution**: Clear app cache/storage and toggle theme again

### Medication Reminders Stop Working

**Issue**: Reminders work initially but stop after app is closed
- ✅ Verify `updateMedicationReminders()` is called after dose recorded
- ✅ Ensure `setupNotifications()` is called in `useFocusEffect()` in `home.tsx`
- ✅ Check AppState listener is properly set up
- ✅ Verify `reminderEnabled` flag is true for medication
- **Solution**: App must call `setupNotifications()` whenever it gains focus

---

## 📚 API & Data Reference

### Firestore Collections

#### `medications/{userId}/medicationList/{medId}`
```json
{
  "id": "med123",
  "name": "Aspirin",
  "dosage": "500mg",
  "frequency": "2x daily",
  "times": ["08:00", "20:00"],
  "startDate": "2024-01-15",
  "duration": "30",
  "color": "#FF6B6B",
  "reminderEnabled": true,
  "currentSupply": 20,
  "totalSupply": 120,
  "refillAt": 30,
  "refillReminder": true,
  "notes": "With meals",
  "userId": "user123"
}
```

#### `doseHistory/{userId}/history/{historyId}`
```json
{
  "medicationId": "med123",
  "timestamp": 1705330800000,
  "taken": true,
  "userId": "user123"
}
```

#### `userProfiles/{userId}`
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "gender": "male",
  "dob": "1990-01-15",
  "address": "123 Main St, City, State",
  "imageUrl": "https://storage.googleapis.com/...",
  "userId": "user123"
}
```

#### `healthDetails/{userId}`
```json
{
  "bloodType": "O+",
  "height": "180",
  "weight": "75",
  "allergies": ["Penicillin", "Shellfish"],
  "conditions": ["Hypertension"],
  "surgeries": ["Appendectomy"],
  "emergencyContact": "Mom - 555-1234",
  "provider": "Dr. Smith",
  "providerPhone": "555-9999",
  "userId": "user123"
}
```

### MedBot API (OpenAI)

**Endpoint**: `https://api.openai.com/v1/chat/completions`

**Model**: `gpt-4o-mini`

**Request Format** (with image):
```json
{
  "model": "gpt-4o-mini",
  "messages": [
    {
      "role": "user",
      "content": [
        { "type": "text", "text": "What should I use for this?" },
        {
          "type": "image_url",
          "image_url": { "url": "data:image/jpeg;base64,/9j/4AAQSkZJRg..." }
        }
      ]
    }
  ],
  "max_tokens": 1024,
  "temperature": 0.7
}
```

---

## 🤝 Contributing

We welcome contributions! Here's how to help:

### 1. Fork the Repository
```bash
git clone https://github.com/your-username/medo
cd medo
```

### 2. Create a Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### 3. Make Changes & Test
- Ensure your code follows the existing style
- Test thoroughly on both iOS and Android
- Add comments for complex logic
- Update README if adding new features

### 4. Commit & Push
```bash
git add .
git commit -m "Add: Brief description of changes"
git push origin feature/your-feature-name
```

### 5. Submit a Pull Request
- Provide clear description of changes
- Link any related issues
- Wait for review and feedback

### Code Standards

- **TypeScript**: Use strict typing, no `any` types
- **Naming**: camelCase for functions/variables, PascalCase for components
- **Components**: Keep functional components, use hooks
- **Formatting**: 2-space indentation, trailing commas
- **Comments**: Document non-obvious logic
- **Testing**: Test on both platforms before submitting

---

## 📄 License

MIT License - See LICENSE file for details

---

## 👨‍💻 Authors & Support

- **Developer**: Waruna Liyanapathirana
- **Contact**: send2liyanapathirana@gmail.com
- **GitHub Issues**: [Report bugs here](https://github.com/your-username/medo/issues)

### Getting Help

- 📖 Check README sections above
- 🐛 Search existing GitHub issues
- 💬 Open a new GitHub issue with:
  - Platform (iOS/Android)
  - Steps to reproduce
  - Expected vs actual behavior
  - App version and device info

---

**Last Updated**: January 2025
**Version**: 2.0.0
**Status**: Active Development