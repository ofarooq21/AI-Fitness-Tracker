
# Mobile App (Expo React Native)

1) Install Node.js (LTS) and `npm i -g expo` (or use `npx`).
2) Create the app:
```bash
npx create-expo-app mobile --template tabs
cd mobile
npm i @tanstack/react-query zustand nativewind
```
3) Run in web (for quick dev):
```bash
npm run web
```
4) Run on iOS/Android:
```bash
npm run ios   # requires Xcode
npm run android  # requires Android Studio / emulator or device
```
5) Configure API base URL in your app (e.g., http://localhost:8000).
6) Build with EAS when ready.
