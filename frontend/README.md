# HAL Helicopter Performance System

Offline-first React Native (Expo managed) aviation calculator for HAL India.
No backend service, no internet — everything runs locally on-device using SQLite.

## Features
- 3 helicopter profiles: **Chetak, Cheetah, Cheetal**
- Landing → Calculations → Performance Results flow
- 8 computed outputs (PA, ISA, Density Altitude, Air Density, AB Temp, AUW, Power Avail, Power Req)
- Multi-modal input: **numpad, handwriting pad (with recognize→confirm→correct loop), voice (web) / dev-build (native)**
- Unit toggles: ft/m, °C/°F, kg/lb, hPa/inHg
- **AUW vs Altitude** SVG chart with current-point indicator + Graph/Table view
- Save / Share professional HAL Report as PDF (offline via `expo-print` + `expo-sharing`)
- Persistent SQLite storage (`expo-sqlite`) for reports & configuration
- Live **Settings** screen — edit calculation formulas & default values during presentations; changes apply instantly, no code changes needed
- Fit-to-Fly logic with 0.01 precision threshold checks
- Toast notifications for errors & warnings
- Tablet + phone responsive

## Setup (Local Development)

```bash
cd frontend
yarn install
yarn start          # opens Expo; scan QR with Expo Go on phone/tablet
```

## Build for Offline Deployment

### Android APK (preferred for HAL deployment)
```bash
cd frontend
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
# APK at android/app/build/outputs/apk/release/app-release.apk
```

### iOS (via EAS / Xcode)
```bash
npx expo prebuild --platform ios
# Open ios/*.xcworkspace in Xcode and archive
```

## Voice Input Notes
- **Web preview**: uses browser `SpeechRecognition` API (Chrome/Edge) — works offline once the browser has cached models.
- **Expo Go**: limited (Expo Go cannot bundle native voice libs). A toast will ask the user to type.
- **Dev Build / Production APK**: add `expo-speech-recognition` (on-device via iOS Speech framework and Android SpeechRecognizer) — rebuild the dev client.

## Handwriting Recognition
The canvas captures strokes with `react-native-svg`. A lightweight heuristic suggests a number; the user then **confirms or corrects manually** — a hybrid flow as requested. The recognizer module is replaceable: swap the `recognize()` function in `src/components/InputDrawer.js` with a bundled TFLite MNIST model for true on-device recognition.

## Configuration Layer (Central Logic)
All default values and formulas live in:
- `src/config/logic.js` — ship defaults (ICAO ISA)
- **Settings screen** (`app/settings.js`) — edit live, persisted in SQLite via `src/db/database.js`

Formulas are plain JavaScript expressions. Available variables are listed under each field.

## Folder Structure

```
frontend/
├── app/                       # expo-router file-based routes
│   ├── _layout.js             # stack + Toast host + AppStateProvider
│   ├── index.js               # Landing page
│   ├── calculations.js        # Inputs + unit toggles + multi-modal drawer
│   ├── results.js             # Performance Results (status, metrics, chart, Save/Share)
│   ├── reports.js             # Saved reports list
│   └── settings.js            # Live formula & defaults editor
├── src/
│   ├── config/logic.js        # Formulas, defaults, unit conversions, calc engine
│   ├── db/database.js         # SQLite offline storage (+ web AsyncStorage fallback)
│   ├── store/AppState.js      # Global React context
│   ├── theme/theme.js         # Colors, spacing, radius, shadow
│   ├── components/
│   │   ├── InputDrawer.js     # Numpad / Pen / Voice modal
│   │   ├── AUWChart.js        # SVG line chart
│   │   └── HalLoader.js       # HAL-logo loading spinner
│   └── utils/pdf.js           # HAL Report PDF builder (expo-print)
├── app.json
└── package.json
```

## DEPLOYMENT.md (local server / desktop)

No server is needed — the app is a self-contained Expo native bundle running on-device. For HAL offline field deployment:

1. **Build the APK** using the commands above.
2. **Distribute via USB / MDM** to the tablets/phones.
3. The SQLite database file `hal_performance.db` is created automatically on first launch inside the app's private sandbox.
4. Reports and configuration persist across sessions and app restarts without any network.
5. Replace the two logo images (`HAL_LOGO`, `MAKE_IN_INDIA`) in `app/index.js` with locally-bundled assets in `assets/images/` before shipping if you want full air-gapped operation (currently they load remote URLs for preview convenience).

No MongoDB, no Node server, no API calls. Zero-internet mode.
