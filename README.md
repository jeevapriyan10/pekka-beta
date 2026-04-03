# PEKKA: Hardcore Offline Fitness & Nutrition Tracker 

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![React Native](https://img.shields.io/badge/React_Native-Expo_SDK_54-20232A?logo=react&logoColor=61DAFB)
![SQLite](https://img.shields.io/badge/Database-Expo_SQLite-003B57?logo=sqlite&logoColor=white)

PEKKA is a premium, **100% offline-first** React Native fitness application built with Expo SDK 54. Designed for absolute data sovereignty, no personal fitness data, diet logs, or workout records ever leave your device. 

## Key Features

- **100% Local Storage:** Entirely powered by `expo-sqlite` and `AsyncStorage`. Zero server dependencies, zero ping times, total privacy.
- **Complete Nutrition Engine (Fuel):**
  - Search, track, and log food across meals (pre-seeded with 120+ offline food elements).
  - TDEE (Mifflin-St Jeor) Auto-calculations.
  - Live local macro tracking natively visualized mapped to high-fidelity SVG interactive donuts.
  - Hydration logging with fluid circular progress tracking.
- **Intelligent Workout Tracking (Train):**
  - Complete history rendering using GitHub-style muscular exhaustion heatmaps.
  - Granular set, rep, and weight tracking.
  - Real-time personal record mapping and volume progression.
- **Built-In Gamification Core:**
  - Complete deterministic XP system. Complete daily challenges (like "Log breakfast" or "Hit Protein Goals") to earn XP and level up through competitive leagues (Bronze → Diamond).

## Tech Stack
- **Framework:** React Native + Expo SDK 54
- **Navigation:** `@react-navigation/bottom-tabs` & `stack` (v6)
- **Database:** `expo-sqlite` (Local Structured Schema) & `@react-native-async-storage/async-storage` (KeyValue)
- **Visuals:** `react-native-reanimated` (v3) + `react-native-svg`
- **UI:** Completely custom vanilla-component token design system (Dark Mode). No native-wind/tailwind bulk. 

## Local Installation & Running

Ensure you have [Node.js](https://nodejs.org/) installed, then:

```bash
# Clone the repository
git clone https://github.com/jeevapriyan10/Pekka-Beta.git
cd Pekka-Beta

# Install dependencies
npm install

# Start the Expo Metro Bundler
npx expo start
```
*Note: Due to the rigorous native dependencies used for data management and graphing, this project operates best using a Development Build, Physical Device, or standard Emulator.*

## Building the APK (For Android)

We highly recommend utilizing [EAS Build](https://expo.dev/eas) to generate a standalone binary:

```bash
# Preview build configures as a shareable .apk
npx eas-cli build --platform android --profile preview
```

## Contributing
Since PEKKA was orchestrated as a 100% offline architecture, contributing primarily involves advancing the UI abstractions, extending the pre-seeded SQLite database schemas, or interpolating new workout calculators. 
Pull requests are actively encouraged and welcomed!

## License
This project is licensed under the MIT License - see the [LICENSE.txt](LICENSE.txt) file for details.
