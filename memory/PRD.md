# HAL Helicopter Performance System — PRD

## Summary
Offline-first React Native (Expo Managed, plain JavaScript) mobile/tablet app for HAL India that computes helicopter performance (Chetak, Cheetah, Cheetal) and generates shareable PDF reports. Zero internet dependency — all data, logic, and storage runs on-device.

## Architecture
- **Frontend-only, no backend.** Per user directive (2026-04-20), the Node.js backend was dropped in favour of fully on-device SQLite storage via `expo-sqlite`.
- **Language:** Plain JavaScript (no TypeScript) per user directive.
- **Routing:** expo-router file-based routes (`app/index.js`, `app/calculations.js`, `app/results.js`, `app/reports.js`, `app/settings.js`).
- **State:** React Context (`src/store/AppState.js`), defaults lazy-loaded from SQLite at boot.
- **DB:** `expo-sqlite` on native, `@react-native-async-storage/async-storage` fallback on web via platform-specific module resolution (`database.native.js` / `database.web.js`).

## Core Features Implemented
1. **Landing Page** – HAL text-logo badge, "Made In India" tricolour badge, Proceed CTA, quick icons (Reports, Settings).
2. **Calculations Page**
   - Airframe selector (Chetak/Cheetah/Cheetal)
   - 8 input fields (Pressure Altitude/Elevation, QNH, OAT, AC Weight, Crew, Fuel, Payload, Additional Load)
   - **Unit toggle pills** per field: ft/m, °C/°F, kg/lb, hPa/inHg
   - **Multi-modal input drawer** with tabs: Keypad, Pen (canvas → Recognize → Confirm-or-Correct hybrid), Voice (web SpeechRecognition; stub with prompt on Expo Go)
   - Live preview of all 8 computed outputs
3. **Performance Results Page**
   - Summary strip (Aircraft · Temp · Altitude)
   - Status banner – green "Within Limits / Operational Status: Normal" or red "Limit Exceeded" with granular reasons
   - 2x2 metric grid (AUW Capability, Payload %, Power Balance ±%, Payload Margin kg)
   - **AUW vs Altitude SVG chart** (limit curve + current-point indicator) with Graph/Table toggle
   - Detail grid of all 8 outputs
   - Save Report (modal with auto-generated `DEVICEID_YYYYMMDD_HHMMSS` name, editable)
   - Share PDF (professional "HAL Report" via `expo-print` + `expo-sharing`, works offline)
   - Reset / Recompute footer
4. **Saved Reports Page** – list from SQLite, per-item share/delete, persistent across sessions.
5. **Settings / Config Page** – Central live-editable configuration layer:
   - All 8 formulas editable as JS expressions (validated before save)
   - All per-aircraft defaults editable (empty weight, MAUW, powers, default crew/fuel/payload, etc.)
   - Saves to SQLite; changes take effect instantly (no app restart / code change needed).
   - Reset-to-defaults option.

## Calculation Logic (Central Layer: `src/config/logic.js`)
- ICAO ISA defaults: PA from elevation+QNH, ISA Temp from PA, Density Altitude, Air Density, AB Temp, AUW sum, Power Available (density-derated), Power Required (AUW & density-scaled).
- Fit-to-Fly threshold checks at **0.01 precision**: AUW vs MAUW, Power Req vs Avail, Density Altitude > 18,000ft, AB Temp > +35°C.
- `buildAUWvsAltitudeCurve` generates the limit curve data for the graph (0–20k ft).
- Unit conversions round-tripped through base units (ft, °C, kg, hPa).

## Offline Strategy
- No network calls anywhere.
- Native build: `expo-sqlite` creates `hal_performance.db` inside app sandbox.
- Preview web: AsyncStorage (localStorage) fallback.
- Logo assets are currently text-based / tricolour shapes rendered in RN — no network images — matching the "true zero-internet" requirement. README documents how to swap in bundled image assets before shipping.

## Testing
- Manual end-to-end verified via Playwright screenshot tool:
  - Landing → Proceed → Calculations (airframe select, numpad input, pen drawer) → Compute → Results (Within Limits status, metrics, SVG chart, detail grid, Save dialog).
- Live formulas validated via `new Function` compile check before being persisted.

## Deviations from Original Spec
- **Backend dropped** (Node.js + SQLite server) → replaced with on-device SQLite, per user request for "true zero-internet" mode.
- **TypeScript removed** → plain JS, per user request for easier maintenance.
- **notistack** → replaced with `react-native-toast-message` (notistack is web-only, not RN compatible).
- **Voice offline on native** requires a dev build with `expo-speech-recognition` (Expo Go cannot bundle native voice libs). Web preview uses browser SpeechRecognition API.
- **Handwriting recognition** is implemented as a hybrid flow (stroke-count heuristic → user confirms/corrects → falls back to manual entry) to stay within Expo Managed. Swap in a TFLite MNIST model for production-grade accuracy.

## Files
```
frontend/
├── app/                       # expo-router screens
│   ├── _layout.js
│   ├── index.js               # Landing
│   ├── calculations.js        # Inputs + multi-modal drawer
│   ├── results.js             # Performance Results
│   ├── reports.js             # Saved reports list
│   └── settings.js            # Live config editor
├── src/
│   ├── config/logic.js        # Central formulas, defaults, calc engine
│   ├── db/database.js         # Platform re-export
│   ├── db/database.native.js  # SQLite impl
│   ├── db/database.web.js     # AsyncStorage fallback
│   ├── store/AppState.js      # Global React context
│   ├── theme/theme.js
│   ├── components/
│   │   ├── InputDrawer.js     # Numpad / Pen / Voice
│   │   ├── AUWChart.js        # SVG chart
│   │   └── HalLoader.js
│   └── utils/pdf.js           # expo-print PDF generator
└── README.md                  # SETUP + DEPLOYMENT
```
