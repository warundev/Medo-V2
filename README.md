# 💊 Medo V2 – Your Smart Medicine Minder

A cross-platform React Native app built with Expo to help users manage their medication schedules, track refills, and monitor daily progress — all while ensuring secure and smooth user experience.

---



## 📱 App Features

- 🔔 **Custom Medication Reminders**  
  Schedule daily or one-time medicine reminders with flexible timing.

- 💊 **Refill Tracking & Alerts**  
  Track your medicine supply and receive alerts when you're running low.

- 🧬 **Biometric Authentication**  
  Enable Face ID / Touch ID for secure app access.

- 📈 **Daily Progress & History Logging**  
  Visualize your medication adherence and view historical logs.

- 🗓️ **Calendar Integration**  
  Plan and manage medication intake via a built-in calendar view.

- 📦 **Local Data Persistence**  
  All data is securely stored locally using AsyncStorage.

- 🌐 **Cross-Platform Compatibility**  
  Runs smoothly on both **iOS** and **Android**.

---

## 🛠️ Tech Stack

| Technology               | Usage                                      |
|--------------------------|---------------------------------------------|
| [React Native](https://reactnative.dev/)     | Cross-platform mobile app framework         |
| [Expo](https://expo.dev/)                    | App tooling and build support               |
| [TypeScript](https://www.typescriptlang.org/)| Strong typing for better code safety        |
| [React Navigation](https://reactnavigation.org/) | Smooth navigation system              |
| [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/) | Push notification system |
| [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) | Persistent local storage    |
| [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) | Smooth animations       |

---

## 🎓 What You'll Learn (If you're studying this project)

- React Native fundamentals and file-based routing
- Using Expo and TypeScript for clean development
- Implementing push notifications and local reminders
- Integrating biometric authentication (Face ID / Touch ID)
- Managing local storage with AsyncStorage
- Calendar-based scheduling and dose tracking UI
- Designing mobile-friendly, clean, and accessible UI

---


## 🙌 Contribute

Found a bug or want to suggest a feature? Open an [issue](https://github.com/mendsalbert/medici-reminder-app/issues) or submit a PR!

Give this repo a ⭐ if you find it useful!

---

## 📸 Screenshots

> _(Add screenshots or app UI mockups here if available!)_


## 📱 Developed With ❤️ Using React Native + Expo

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/medo
cd medo
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the App (Expo)

```bash
npx expo start
```

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