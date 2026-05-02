# repright - AI Personal Trainer

**repright** is an immersive, AI-powered fitness application built with React Native and ML pose estimation. It provides real-time body tracking, rep counting, and form coaching to help you workout with perfect technique—entirely hands-free.

![](img/react-native-demo.jpg)

## 🌟 Key Features

- **🤖 AI Form Coaching:** Real-time feedback HUD that color-codes your form (Cyan for Perfect, Red for Adjust).
- **🖐 Hands-Free Control:** Navigate the app using gestures (Thumbs Up to Pause, Raised Hand to Skip Exercise).
- **🔥 Gamified Workouts:** Earn "Perfect Rep Streaks" with visual badges and intense haptic feedback.
- **🕒 Session Tracking:** Live workout timer and rep progress indicators.
- **📱 Immersive HUD:** Heads-Up Display designed for visibility from a distance.
- **💪 40+ Exercises:** Supports Squats, Push-ups, Lunges, Bicep Curls, Plank, and more.

## 🚀 Getting Started

### Prerequisites

- [React Native Environment](https://reactnative.dev/docs/environment-setup)
- Physical iOS or Android device (Camera required)
- A QuickPose SDK Key (Get one free at [dev.quickpose.ai](https://dev.quickpose.ai))

### Installation

1. **Clone the Repo**
   ```bash
   git clone https://github.com/NamanjainAkt/RepRight.git
   cd RepRight/example
   ```

2. **Install Dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Configure SDK Key**
   Update `example/sdkConfig.ts` with your key:
   ```typescript
   export const QUICKPOSE_SDK_KEY = "YOUR_KEY_HERE";
   ```

4. **Run on Device**

   **iOS:**
   ```bash
   cd ios && pod install && cd ..
   npx react-native run-ios --device
   ```

   **Android:**
   ```bash
   npx react-native run-android
   ```

## 🖐 Gesture Controls

| Gesture | Action | Hold Time |
|---------|--------|-----------|
| 👍 Thumbs Up | Pause / Resume | 1.5s |
| 🖐 Raised Hand | Next Exercise | 1.5s |

## 🛠 Tech Stack

- **Framework:** React Native
- **Pose Estimation:** QuickPose ML SDK
- **Animation:** React Native Reanimated
- **Interactions:** React Native Gesture Handler
- **Haptics:** React Native Haptic Feedback
- **UI:** Custom HUD Components & Bottom Sheets

## 🛡 License

Built with ❤️ by Naman Jain. 
Powered by QuickPose.ai
